import { Stack } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeadlineMark } from '@/components/DeadlineMark';
import { PageHeading } from '@/components/PageHeading';
import { Section } from '@/components/Section';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StatusBadge } from '@/components/StatusBadge';
import { applicationTimeline, StatusTimeline } from '@/components/StatusTimeline';
import { applicationRequirements } from '@/features/applications/api';
import { useApplication } from '@/features/applications/hooks';
import { mergeDocuments, useDocumentQueue } from '@/features/applications/offline';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';
import { RequirementUpload } from '@/screens/student/ApplyScreen/RequirementUpload';
import { spacing } from '@/styles';

import { createStyles } from './ApplicationDetailScreen.styles';

/** One short line under the status badge; the badge already names the status. */
const STATUS_HELP: Record<string, string> = {
  submitted: 'Waiting for the admissions team.',
  under_review: 'Your documents are being reviewed.',
  action_required: 'Replace the flagged document below.',
  accepted: 'Congratulations! Read the message below.',
  rejected: 'Read the message from the college below.',
};

/** SDD screen 14 — status, decision, requirement checklist and resubmissions. */
export function ApplicationDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const application = useApplication(id);
  const queue = useDocumentQueue(id);
  const insets = useSafeAreaInsets();

  if (application.isPending) return <LoadingState variant="detail" />;
  if (application.isError) {
    return <ErrorState error={application.error} onRetry={application.refetch} />;
  }

  const app = application.data;
  const color = applicationStatusColor(app.status, colors);
  const decided = app.status === 'accepted' || app.status === 'rejected';
  const requirements = applicationRequirements(app).filter((r) => r.kind === 'document');
  // Resubmissions queue on the device first, so they also work offline.
  const documents = mergeDocuments(app.documents, queue.pending);
  const docFor = (reqId: string) => documents.find((d) => d.requirement_id === reqId);
  const approved = app.documents.filter((d) => d.review_status === 'approved').length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={application.isRefetching}
          onRefresh={application.refetch}
        />
      }>
      <Stack.Screen options={{ title: 'Application details' }} />

      <View style={styles.heading}>
        <PageHeading
          title={app.college?.name ?? ''}
          subtitle={`${app.program?.name ?? ''}${app.second_program ? ` · 2nd choice: ${app.second_program.name}` : ''}`}
        />
      </View>

      <Section band title="Where things stand">
        <View style={styles.status}>
          <StatusBadge label={APPLICATION_STATUS_LABELS[app.status]} color={color} />
          {STATUS_HELP[app.status] ? (
            <Text style={styles.body}>{STATUS_HELP[app.status]}</Text>
          ) : null}
          {!decided ? <DeadlineMark date={app.program?.deadline} showDate /> : null}
        </View>
        <StatusTimeline steps={applicationTimeline(app.status, app.submitted_at, app.decided_at)} />
      </Section>

      {decided ? (
        <View style={[styles.decision, { borderTopColor: color }]}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Message from {app.college?.name}
          </Text>
          {app.status === 'accepted' && app.final_program ? (
            <Text style={styles.admitted}>Admitted to {app.final_program.name}</Text>
          ) : null}
          <Text style={styles.body}>{app.decision_message}</Text>
          {app.decided_at ? (
            <Text style={styles.meta}>{new Date(app.decided_at).toLocaleDateString()}</Text>
          ) : null}
        </View>
      ) : null}

      <Section
        title="Requirements checklist"
        meta={`${approved} of ${requirements.length} approved`}>
        {requirements.map((req) => {
          const doc = docFor(req.id);
          // Only flagged documents can be replaced once submitted.
          const canReplace =
            !decided &&
            (doc?.local || doc?.review_status === 'resubmit' || doc?.review_status === 'rejected');
          return (
            <RequirementUpload
              key={req.id}
              requirement={req}
              document={doc}
              locked={!canReplace}
              onUpload={(file) => queue.attach(req, file, doc)}
            />
          );
        })}
      </Section>

      {app.essay ? (
        <Section title="Your essay">
          <Text style={styles.essay}>{app.essay}</Text>
        </Section>
      ) : null}
    </ScrollView>
  );
}
