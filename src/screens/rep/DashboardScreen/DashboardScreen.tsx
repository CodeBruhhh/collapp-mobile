import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { ActionRow } from '@/components/ActionRow';
import { Button } from '@/components/Button';
import { LedgerRow } from '@/components/LedgerRow';
import { MetricPanel } from '@/components/MetricPanel';
import { MetricRows } from '@/components/MetricRow';
import { Notice } from '@/components/Notice';
import { PageHeading } from '@/components/PageHeading';
import { Section } from '@/components/Section';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { APPLICANT_FILTERS, studentName } from '@/features/rep/api';
import { useApplicants, useMyCollege } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createScreenStyles } from '@/screens/screenStyles';

/** SDD screen 19 — applicant counts, profile status, recent applicants and quick actions. */
export function DashboardScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const college = useMyCollege();
  const applicants = useApplicants();

  if (college.isPending) return <LoadingState variant="detail" />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const c = college.data;
  const list = applicants.data ?? [];
  const newCount = list.filter(APPLICANT_FILTERS.new).length;
  const isDraft = c.profile_status === 'draft';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.page}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={college.isRefetching || applicants.isRefetching}
          onRefresh={() => {
            college.refetch();
            applicants.refetch();
          }}
        />
      }>
      <View style={styles.overview}>
        <PageHeading title="Welcome back" subtitle={c.name} />

        {isDraft ? (
          <View style={styles.section}>
            <Notice
              tone="danger"
              title="Your profile is not published"
              message={`Students can't find or apply to ${c.name} until you publish it. Add your programs and requirements first.`}
            />
            <Button label="Finish profile" onPress={() => router.push('/rep/institution')} />
          </View>
        ) : null}

        <View style={styles.totals}>
          <MetricPanel label="New applicants" value={newCount} icon="people" />
          <MetricRows
            metrics={[
              { label: 'Applicants', value: list.length },
              { label: 'In review', value: list.filter(APPLICANT_FILTERS.review).length },
              { label: 'Accepted', value: list.filter(APPLICANT_FILTERS.accepted).length },
            ]}
          />
        </View>
      </View>

      <Section band title="Quick actions">
        <ActionRow
          label="Review applicants"
          icon="people"
          onPress={() => router.push('/rep/applicants')}
        />
        <ActionRow
          label="Requirements"
          icon="document-text"
          onPress={() => router.push('/rep/requirements')}
        />
        <ActionRow
          label="Create post"
          icon="megaphone"
          onPress={() => router.push({ pathname: '/rep/post/[id]', params: { id: 'new' } })}
        />
        <ActionRow
          label="Messages"
          icon="chatbubbles"
          onPress={() => router.push('/rep/messages')}
        />
      </Section>

      <Section title="Recent applicants">
        {list.length === 0 ? (
          <Text style={styles.meta}>No applications yet.</Text>
        ) : (
          list.slice(0, 5).map((a) => (
            <LedgerRow
              key={a.id}
              title={studentName(a.student)}
              subtitle={a.program?.name}
              onPress={() =>
                router.push({ pathname: '/rep/applicant/[id]', params: { id: a.id } })
              }>
              <View style={styles.metaLine}>
                <StatusBadge
                  label={APPLICATION_STATUS_LABELS[a.status]}
                  color={applicationStatusColor(a.status, colors)}
                />
              </View>
            </LedgerRow>
          ))
        )}
      </Section>
    </ScrollView>
  );
}
