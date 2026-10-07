import { Stack } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { applicationRequirements } from '@/features/applications/api';
import { useApplication, useApplicationActions } from '@/features/applications/hooks';
import {
  APPLICATION_STATUS_LABELS,
  applicationProgress,
  applicationStatusColor,
  deadlineLabel,
} from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';
import { RequirementUpload } from '@/screens/student/ApplyScreen/RequirementUpload';

import { createStyles } from './ApplicationDetailScreen.styles';

const STATUS_HELP: Record<string, string> = {
  submitted: 'Submitted. The admissions team will start reviewing it soon.',
  under_review: 'The admissions team is reviewing your documents.',
  action_required: 'Some documents need your attention. Replace them below.',
  accepted: 'Congratulations! See the message from the college below.',
  rejected: 'A decision has been made. See the message from the college below.',
};

/** SDD screen 14 — status, decision, requirement checklist and resubmissions. */
export function ApplicationDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const application = useApplication(id);
  const actions = useApplicationActions();
  const [busyRequirement, setBusyRequirement] = useState<string | null>(null);

  if (application.isPending) return <LoadingState />;
  if (application.isError) {
    return <ErrorState error={application.error} onRetry={application.refetch} />;
  }

  const app = application.data;
  const color = applicationStatusColor(app.status, colors);
  const decided = app.status === 'accepted' || app.status === 'rejected';
  const requirements = applicationRequirements(app).filter((r) => r.kind === 'document');
  const docFor = (reqId: string) => app.documents.find((d) => d.requirement_id === reqId);
  const approved = app.documents.filter((d) => d.review_status === 'approved').length;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={application.isRefetching} onRefresh={application.refetch} />
      }>
      <Stack.Screen options={{ title: 'Application details' }} />

      <View>
        <Text accessibilityRole="header" style={styles.title}>
          {app.college?.name}
        </Text>
        <Text style={styles.meta}>
          {app.program?.name}
          {app.second_program ? ` · 2nd choice: ${app.second_program.name}` : ''}
        </Text>
      </View>

      <Card>
        <StatusBadge label={APPLICATION_STATUS_LABELS[app.status]} color={color} />
        <ProgressBar value={applicationProgress(app.status)} color={color} />
        <Text style={styles.body}>{STATUS_HELP[app.status] ?? ''}</Text>
        {app.submitted_at ? (
          <Text style={styles.meta}>
            Submitted {new Date(app.submitted_at).toLocaleDateString()}
          </Text>
        ) : null}
        {!decided && app.program?.deadline ? (
          <Text style={styles.meta}>
            Program deadline {app.program.deadline} · {deadlineLabel(app.program.deadline)}
          </Text>
        ) : null}
      </Card>

      {decided ? (
        <Card style={{ borderColor: color }}>
          <Text style={styles.sectionTitle}>Message from {app.college?.name}</Text>
          {app.status === 'accepted' && app.final_program ? (
            <Text style={styles.body}>Admitted to {app.final_program.name}</Text>
          ) : null}
          <Text style={styles.body}>{app.decision_message}</Text>
          {app.decided_at ? (
            <Text style={styles.meta}>{new Date(app.decided_at).toLocaleDateString()}</Text>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Requirements checklist</Text>
          <Text style={styles.meta}>
            {approved} of {requirements.length} approved
          </Text>
        </View>
        {requirements.map((req) => {
          const doc = docFor(req.id);
          // Only flagged documents can be replaced once submitted.
          const canReplace =
            !decided && (doc?.review_status === 'resubmit' || doc?.review_status === 'rejected');
          return (
            <RequirementUpload
              key={req.id}
              requirement={req}
              document={doc}
              busy={busyRequirement === req.id}
              locked={!canReplace}
              onUpload={async (file) => {
                setBusyRequirement(req.id);
                try {
                  await actions.attachDocument.mutateAsync({
                    applicationId: app.id,
                    requirementId: req.id,
                    label: req.label,
                    file,
                    existing: doc,
                  });
                } finally {
                  setBusyRequirement(null);
                }
              }}
            />
          );
        })}
      </View>

      {app.essay ? (
        <Card>
          <Text style={styles.sectionTitle}>Your essay</Text>
          <Text style={styles.body}>{app.essay}</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}
