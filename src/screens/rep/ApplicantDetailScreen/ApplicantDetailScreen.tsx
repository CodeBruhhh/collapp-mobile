import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { InfoRow } from '@/components/InfoRow';
import { Section } from '@/components/Section';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StickyActionBar } from '@/components/StickyActionBar';
import { TickMeter } from '@/components/TickMeter';
import { useAuth } from '@/context/AuthContext';
import { useDocumentChecks, useRecheckDocument, useScoreApplication } from '@/features/ai/hooks';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { useStartThread } from '@/features/messaging/hooks';
import { firstOf, studentName } from '@/features/rep/api';
import {
  useApplicant,
  useAssignApplications,
  useMyCollege,
  useProgramSeats,
  useReleaseActions,
  useRepActions,
  useReviewers,
  useStagedDecisions,
  useTemplates,
} from '@/features/rep/hooks';
import { useNextApplicant } from '@/features/rep/reviewSession';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { KeyboardAwareScrollView } from '@/lib/keyboard';
import { getErrorMessage } from '@/lib/validation';
import { KEYBOARD_GAP, spacing } from '@/styles';

import { createScreenStyles } from '@/screens/screenStyles';
import { DecisionSheet } from './DecisionSheet';
import { DocumentReviewCard } from './DocumentReviewCard';
import { EssaySummary } from './EssaySummary';

/** SDD screen 21 — applicant profile, advisory AI fit, document review and final decision. */
export function ApplicantDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const insets = useSafeAreaInsets();
  const applicant = useApplicant(id);
  const college = useMyCollege();
  const actions = useRepActions();
  const scoreApplication = useScoreApplication();
  const startThread = useStartThread();
  const [deciding, setDeciding] = useState(false);
  const checks = useDocumentChecks(id, applicant.data?.documents ?? []);
  const recheck = useRecheckDocument(id);
  const staged = useStagedDecisions();
  const release = useReleaseActions();
  const userId = useAuth().session?.user.id ?? '';
  const nextUp = useNextApplicant(id);
  const reviewers = useReviewers();
  const assign = useAssignApplications();
  const seats = useProgramSeats();
  const templates = useTemplates();
  const [choosingReviewer, setChoosingReviewer] = useState(false);

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
  const held = decided ? undefined : staged.byApplication.get(a.id);
  const heldProgram = programs.find((p) => p.id === held?.final_program_id)?.name;
  // New decisions default to the batch once the college has started one.
  const batchActive = (staged.data?.length ?? 0) > 0 || Boolean(college.data?.results_release_at);

  async function releaseThisOne() {
    try {
      const result = await release.release.mutateAsync([a.id]);
      if (result.failed.length) notify.error('Not released', result.failed[0].error);
      else notify.success('Decision sent', 'The student has been notified.');
    } catch (e) {
      notify.error('Not released', getErrorMessage(e));
    }
  }

  const assignee = a.assigned_to;
  const assigneeName =
    assignee === userId
      ? 'You'
      : (reviewers.data?.find((r) => r.id === assignee)?.full_name ??
        (assignee ? 'Another rep' : null));
  const templateValues = {
    first_name: s?.first_name || name,
    full_name: name,
    program: a.program?.name,
    college: college.data?.name,
  };

  async function assignTo(reviewer: string | null, label: string) {
    try {
      await assign.mutateAsync({ ids: [a.id], assignee: reviewer });
      notify.success(reviewer ? `Assigned to ${label}` : 'Unassigned');
    } catch (e) {
      notify.error('Could not assign', getErrorMessage(e));
    }
  }

  /** Move on to the next applicant in the queue the rep came from. */
  function reviewNext(afterDecision: boolean) {
    const nextName = nextUp.next?.student_name;
    if (nextUp.goNext()) {
      if (afterDecision) notify.success('Saved', `Next: ${nextName || 'the next applicant'}`);
    } else if (afterDecision && nextUp.active && !nextUp.loading) {
      notify.info('All done here', 'That was the last applicant in this list.');
    }
  }

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
          // Where the rep is in the queue they came from, e.g. "3 of 52".
          title: nextUp.position && nextUp.total ? `${nextUp.position} of ${nextUp.total}` : '',
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
      {/* Scrolls a document's review notes clear of the keyboard. */}
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: spacing.xl + (decided ? insets.bottom : 0) }}
        bottomOffset={KEYBOARD_GAP}
        keyboardShouldPersistTaps="handled"
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
          <View style={styles.reviewer}>
            <Icon name="person" size={16} color={colors.textMuted} />
            <Text style={[styles.meta, styles.flex]}>
              {assigneeName
                ? assignee === userId
                  ? 'You are reviewing this applicant'
                  : `${assigneeName} is reviewing this applicant`
                : 'No reviewer assigned'}
            </Text>
            {!decided && assignee !== userId ? (
              <Button
                variant="link"
                label="Assign to me"
                loading={assign.isPending}
                onPress={() => assignTo(userId, 'you')}
              />
            ) : null}
            {!decided && (assignee || (reviewers.data?.length ?? 0) > 1) ? (
              <Button variant="link" label="Change" onPress={() => setChoosingReviewer(true)} />
            ) : null}
          </View>
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

        {held ? (
          <View style={[styles.decision, { borderTopColor: colors.status.underReview }]}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {held.decision === 'accepted'
                ? `Admission held${heldProgram ? `: ${heldProgram}` : ''}`
                : 'Decline held'}
            </Text>
            <Text style={styles.meta}>
              {college.data?.results_release_at
                ? `Goes out with the batch on ${new Date(college.data.results_release_at).toLocaleString()}.`
                : 'Not sent yet. The student is told when you release results.'}
            </Text>
            <Text style={styles.body}>{held.decision_message}</Text>
            <View style={styles.actions}>
              <View style={styles.action}>
                <Button
                  variant="secondary"
                  label="Send this one now"
                  loading={release.release.isPending}
                  onPress={releaseThisOne}
                />
              </View>
              <View style={styles.action}>
                <Button
                  variant="link"
                  label="Withdraw hold"
                  loading={release.unstage.isPending}
                  onPress={() =>
                    release.unstage
                      .mutateAsync(a.id)
                      .catch((e) => notify.error('Could not withdraw', getErrorMessage(e)))
                  }
                />
              </View>
            </View>
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
            <EssaySummary applicationId={a.id} />
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
              templates={templates.data}
              templateValues={templateValues}
              aiCheck={checks.byDocument.get(doc.id)}
              aiAwaiting={checks.isAwaiting(doc)}
              onRecheck={
                decided
                  ? undefined
                  : () =>
                      recheck
                        .mutateAsync(doc.id)
                        .catch((e) => notify.error('AI check failed', getErrorMessage(e)))
              }
              rechecking={recheck.isPending && recheck.variables === doc.id}
            />
          ))}
        </Section>
      </KeyboardAwareScrollView>

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
            <View style={styles.row}>
              <View style={styles.flex}>
                <Button
                  label={held ? 'Change held decision' : 'Make final decision'}
                  onPress={() => setDeciding(true)}
                />
              </View>
              {nextUp.next ? (
                <Button variant="secondary" label="Next" onPress={() => reviewNext(false)} />
              ) : null}
            </View>
          </View>
        </StickyActionBar>
      ) : nextUp.next ? (
        <StickyActionBar>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label={`Next: ${nextUp.next.student_name || 'next applicant'}`}
              onPress={() => reviewNext(false)}
            />
          </View>
        </StickyActionBar>
      ) : null}

      <ActionSheet
        visible={choosingReviewer}
        onClose={() => setChoosingReviewer(false)}
        eyebrow="Reviewer"
        title={`Who reviews ${s?.first_name || name}?`}
        message="The reviewer sees this applicant under Reviewer: Assigned to me. Anyone at your college can still open it."
        actions={[
          ...(reviewers.data ?? []).map((r) => ({
            label: r.id === userId ? `${r.full_name} (you)` : r.full_name,
            hint: r.id === assignee ? 'Current reviewer' : undefined,
            disabled: r.id === assignee,
            onPress: () => assignTo(r.id, r.id === userId ? 'you' : r.full_name),
          })),
          ...(assignee
            ? [{ label: 'Unassign', destructive: true, onPress: () => assignTo(null, '') }]
            : []),
        ]}
      />

      <DecisionSheet
        // Remount with the held decision's values whenever it changes.
        key={held?.staged_at ?? 'new'}
        visible={deciding}
        onClose={() => setDeciding(false)}
        studentFirstName={s?.first_name || name}
        studentFullName={name}
        collegeName={college.data?.name ?? 'our college'}
        programs={programs}
        templates={templates.data ?? []}
        seatsFor={(programId) => {
          const seat = seats.data?.get(programId);
          if (!seat) return undefined;
          // This applicant's own held admission shouldn't count against them.
          const own = held?.decision === 'accepted' && held.final_program_id === programId ? 1 : 0;
          return { slots: seat.slots, taken: seat.admitted + seat.held - own };
        }}
        canAdmit={allApproved}
        submitting={actions.setStatus.isPending || release.stage.isPending}
        initial={
          held
            ? {
                decision: held.decision === 'accepted' ? 'accept' : 'reject',
                programId: held.final_program_id,
                message: held.decision_message,
              }
            : null
        }
        defaultHold={batchActive}
        onSubmit={async ({ decision, programId, message, hold }) => {
          if (hold) {
            await release.stage.mutateAsync({
              applicationId: a.id,
              decision: decision === 'accept' ? 'accepted' : 'rejected',
              finalProgramId: programId,
              message,
            });
            if (!nextUp.next)
              notify.success('Decision held', 'It goes out when you release results.');
          } else {
            await actions.setStatus.mutateAsync({
              id: a.id,
              changes: {
                status: decision === 'accept' ? 'accepted' : 'rejected',
                decision_message: message,
                final_program_id: programId,
              },
            });
          }
          // Straight on to the next applicant, once the sheet has closed.
          setTimeout(() => reviewNext(true), 0);
        }}
      />
    </View>
  );
}
