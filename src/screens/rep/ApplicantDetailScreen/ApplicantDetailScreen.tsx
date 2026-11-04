import { router, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { InfoRow } from '@/components/InfoRow';
import { Section } from '@/components/Section';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StickyActionBar } from '@/components/StickyActionBar';
import { TickMeter } from '@/components/TickMeter';
import { useScoreApplication } from '@/features/ai/hooks';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { useStartThread } from '@/features/messaging/hooks';
import { firstOf, studentName } from '@/features/rep/api';
import { useApplicant, useMyCollege, useRepActions } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';
import { spacing } from '@/styles';

import { createScreenStyles } from '@/screens/screenStyles';
import { DecisionSheet } from './DecisionSheet';
import { DocumentReviewCard } from './DocumentReviewCard';

/** SDD screen 21 — applicant profile, advisory AI fit, document review and final decision. */
export function ApplicantDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const applicant = useApplicant(id);
  const college = useMyCollege();
  const actions = useRepActions();
  const scoreApplication = useScoreApplication();
  const startThread = useStartThread();
  const [deciding, setDeciding] = useState(false);

  if (applicant.isPending) return <LoadingState variant="detail" />;
  if (applicant.isError) {
    return <ErrorState error={applicant.error} onRetry={applicant.refetch} />;
  }

  const a = applicant.data;
  const s = a.student;
  const name = studentName(s);
  const address = (s?.address ?? {}) as Record<string, string | undefined>;
  const decided = a.status === 'accepted' || a.status === 'rejected';
  const approvedCount = a.documents.filter((d) => d.review_status === 'approved').length;
  const allApproved = a.documents.length > 0 && approvedCount === a.documents.length;
  const programs = [a.program, a.second_program].filter((p): p is { id: string; name: string } =>
    Boolean(p),
  );
  const score = firstOf(a.ai_score);
  const statusColor = applicationStatusColor(a.status, colors);

  async function openChat() {
    try {
      const thread = await startThread.mutateAsync({ studentId: a.student_id });
      router.push({ pathname: '/rep/thread/[id]', params: { id: thread.id } });
    } catch (e) {
      notify.error('Could not open conversation', getErrorMessage(e));
    }
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Message ${name}`}
              disabled={startThread.isPending}
              onPress={openChat}
              style={styles.headerIcon}>
              <Icon name="chatbubble-ellipses" size={22} color={colors.onPrimary} />
            </Pressable>
          ),
        }}
      />
      {/* Keeps document notes visible above the keyboard. */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: spacing.xl + (decided ? insets.bottom : 0) }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          refreshControl={
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={applicant.isRefetching}
              onRefresh={applicant.refetch}
            />
          }>
          <View style={styles.overview}>
            <View style={styles.identity}>
              <Avatar name={name} avatarPath={s?.profile?.avatar_path} />
              <View style={[styles.flex, styles.headerBlock]}>
                <Text accessibilityRole="header" style={styles.pageName}>
                  {name}
                </Text>
                <Text style={styles.subtitle}>
                  {a.program?.name}
                  {a.second_program ? ` · 2nd: ${a.second_program.name}` : ''}
                </Text>
              </View>
            </View>
            <StatusBadge label={APPLICATION_STATUS_LABELS[a.status]} color={statusColor} />
          </View>

          {decided ? (
            <View style={[styles.decision, { borderTopColor: statusColor }]}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {a.status === 'accepted'
                  ? `Admitted${a.final_program ? ` to ${a.final_program.name}` : ''}`
                  : 'Application declined'}
              </Text>
              {a.decision_message ? <Text style={styles.body}>{a.decision_message}</Text> : null}
            </View>
          ) : null}

          <Section band title="AI fit score" meta="Advisory">
            {score ? (
              <>
                <View style={styles.fit}>
                  <Text style={styles.fitValue}>{Math.round(score.fit_score)}%</Text>
                  <Text style={styles.meta}>Institutional fit</Text>
                  <TickMeter value={score.fit_score} label="Institutional fit" />
                </View>
                <View style={styles.fit}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.meta}>Enrollment likelihood</Text>
                    <Text style={styles.cardTitle}>{Math.round(score.enrollment_likelihood)}%</Text>
                  </View>
                  <TickMeter value={score.enrollment_likelihood} label="Enrollment likelihood" />
                </View>
                {score.explanation ? (
                  <View style={styles.fit}>
                    {score.explanation.split(' · ').map((reason) => (
                      <View key={reason} style={styles.reason}>
                        <Icon name="checkmark" size={14} color={colors.status.accepted} />
                        <Text style={[styles.meta, styles.flex]}>{reason}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.meta}>Not scored yet</Text>
            )}
            {!decided ? (
              <Button
                variant="link"
                label={score ? 'Recalculate' : 'Calculate fit score'}
                loading={scoreApplication.isPending}
                onPress={() =>
                  scoreApplication
                    .mutateAsync(a.id)
                    .catch((e) => notify.error('Could not score', getErrorMessage(e)))
                }
              />
            ) : null}
          </Section>

          <Section title="Applicant">
            <InfoRow label="Email" value={s?.profile?.email} />
            <InfoRow label="Senior high school" value={s?.senior_high_school ?? undefined} />
            <InfoRow label="Strand" value={s?.strand ?? undefined} />
            <InfoRow label="General average" value={s?.gpa?.toString()} />
            <InfoRow label="Mobile" value={s?.mobile ?? undefined} />
            <InfoRow
              label="Location"
              value={[address.city, address.province].filter(Boolean).join(', ')}
            />
            <InfoRow label="Interested in" value={s?.target_majors.join(', ')} />
            <InfoRow
              label="Submitted"
              value={a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : undefined}
            />
          </Section>

          {a.essay ? (
            <Section title="Essay">
              <Text style={[styles.body, styles.block]}>{a.essay}</Text>
            </Section>
          ) : null}

          <Section title="Documents" meta={`${approvedCount}/${a.documents.length} approved`}>
            {a.documents.map((doc) => (
              <DocumentReviewCard
                key={doc.id}
                document={doc}
                locked={decided}
                onReview={(status, notes) =>
                  actions.reviewDocument.mutateAsync([doc.id, status, notes]).then(() => undefined)
                }
              />
            ))}
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      {!decided ? (
        <StickyActionBar>
          <View style={styles.stickyColumn}>
            {!allApproved ? (
              <Text style={styles.footerHint}>
                {a.documents.length - approvedCount} document
                {a.documents.length - approvedCount === 1 ? '' : 's'} left to approve before
                admitting
              </Text>
            ) : null}
            <Button label="Make final decision" onPress={() => setDeciding(true)} />
          </View>
        </StickyActionBar>
      ) : null}

      <DecisionSheet
        visible={deciding}
        onClose={() => setDeciding(false)}
        studentFirstName={s?.first_name || name}
        collegeName={college.data?.name ?? 'our college'}
        programs={programs}
        canAdmit={allApproved}
        submitting={actions.setStatus.isPending}
        onSubmit={async ({ decision, programId, message }) => {
          await actions.setStatus.mutateAsync({
            id: a.id,
            changes: {
              status: decision === 'accept' ? 'accepted' : 'rejected',
              decision_message: message,
              final_program_id: programId,
            },
          });
        }}
      />
    </View>
  );
}
