import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useScoreApplication } from '@/features/ai/hooks';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { useStartThread } from '@/features/messaging/hooks';
import { firstOf, studentName } from '@/features/rep/api';
import { useApplicant, useMyCollege, useRepActions } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createRepStyles } from '../repStyles';
import { DecisionSheet } from './DecisionSheet';
import { DocumentReviewCard } from './DocumentReviewCard';

/** SDD screen 21 — applicant profile, advisory AI fit, document review and final decision. */
export function ApplicantDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const headerHeight = useHeaderHeight();
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
      Alert.alert('Could not open conversation', getErrorMessage(e));
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
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
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          refreshControl={
            <RefreshControl refreshing={applicant.isRefetching} onRefresh={applicant.refetch} />
          }>
          <View style={styles.headerBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              {name}
            </Text>
            <Text style={styles.subtitle}>
              {a.program?.name}
              {a.second_program ? ` · 2nd: ${a.second_program.name}` : ''}
            </Text>
            <StatusBadge label={APPLICATION_STATUS_LABELS[a.status]} color={statusColor} />
          </View>

          {decided ? (
            <Card style={[styles.decisionCard, { borderLeftColor: statusColor }]}>
              <Text style={styles.cardTitle}>
                {a.status === 'accepted'
                  ? `Admitted${a.final_program ? ` to ${a.final_program.name}` : ''}`
                  : 'Application declined'}
              </Text>
              {a.decision_message ? <Text style={styles.body}>{a.decision_message}</Text> : null}
            </Card>
          ) : null}

          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>AI fit score</Text>
              <Text style={styles.meta}>Advisory</Text>
            </View>
            {score ? (
              <>
                <View style={styles.rowBetween}>
                  <Text style={styles.meta}>Institutional fit</Text>
                  <Text style={styles.cardTitle}>{Math.round(score.fit_score)}%</Text>
                </View>
                <ProgressBar value={score.fit_score / 100} />
                <View style={styles.rowBetween}>
                  <Text style={styles.meta}>Enrollment likelihood</Text>
                  <Text style={styles.cardTitle}>{Math.round(score.enrollment_likelihood)}%</Text>
                </View>
                <ProgressBar value={score.enrollment_likelihood / 100} />
                {score.explanation
                  ? score.explanation.split(' · ').map((reason) => (
                      <View key={reason} style={styles.reason}>
                        <Ionicons name="checkmark" size={14} color={colors.status.accepted} />
                        <Text style={[styles.meta, styles.flex]}>{reason}</Text>
                      </View>
                    ))
                  : null}
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
                    .catch((e) => Alert.alert('Could not score', getErrorMessage(e)))
                }
              />
            ) : null}
          </Card>

          <Card>
            <Text style={styles.cardTitle}>Applicant</Text>
            {[
              ['Email', s?.profile?.email],
              ['Senior high school', s?.senior_high_school],
              ['Strand', s?.strand],
              ['General average', s?.gpa?.toString()],
              ['Mobile', s?.mobile],
              ['Location', [address.city, address.province].filter(Boolean).join(', ')],
              ['Interested in', s?.target_majors.join(', ')],
              ['Submitted', a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : null],
            ].map(([label, value]) => (
              <View key={label} style={styles.kv}>
                <Text style={styles.kvLabel}>{label}</Text>
                <Text style={styles.kvValue}>{value || '—'}</Text>
              </View>
            ))}
          </Card>

          {a.essay ? (
            <Card>
              <Text style={styles.cardTitle}>Essay</Text>
              <Text style={styles.body}>{a.essay}</Text>
            </Card>
          ) : null}

          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>Documents</Text>
              <Text style={styles.meta}>
                {approvedCount}/{a.documents.length} approved
              </Text>
            </View>
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {!decided ? (
        <View style={styles.footer}>
          {!allApproved ? (
            <Text style={styles.footerHint}>
              {a.documents.length - approvedCount} document
              {a.documents.length - approvedCount === 1 ? '' : 's'} left to approve before admitting
            </Text>
          ) : null}
          <Button label="Make final decision" onPress={() => setDeciding(true)} />
        </View>
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
    </SafeAreaView>
  );
}
