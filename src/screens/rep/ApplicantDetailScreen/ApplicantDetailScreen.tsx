import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { useScoreApplication } from '@/features/ai/hooks';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { firstOf, studentName } from '@/features/rep/api';
import { useApplicant, useRepActions } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createRepStyles } from '../repStyles';
import { DocumentReviewCard } from './DocumentReviewCard';

type Decision = 'accept' | 'reject';

/** SDD screen 21 — applicant profile, advisory AI fit, document review and final decision. */
export function ApplicantDetailScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const applicant = useApplicant(id);
  const actions = useRepActions();
  const scoreApplication = useScoreApplication();

  const [decision, setDecision] = useState<Decision | null>(null);
  const [finalProgramId, setFinalProgramId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  if (applicant.isPending) return <LoadingState />;
  if (applicant.isError) {
    return <ErrorState error={applicant.error} onRetry={applicant.refetch} />;
  }

  const a = applicant.data;
  const s = a.student;
  const address = (s?.address ?? {}) as Record<string, string | undefined>;
  const decided = a.status === 'accepted' || a.status === 'rejected';
  const allApproved =
    a.documents.length > 0 && a.documents.every((d) => d.review_status === 'approved');
  const choices = [a.program, a.second_program].filter((p): p is { id: string; name: string } =>
    Boolean(p),
  );
  const score = firstOf(a.ai_score);

  function confirmDecision() {
    if (!decision) return;
    const accepting = decision === 'accept';
    const programId = finalProgramId ?? (choices.length === 1 ? choices[0].id : null);
    if (accepting && !programId) {
      Alert.alert('Choose a program', 'Select which program the student is admitted to.');
      return;
    }
    Alert.alert(
      accepting ? 'Admit this student?' : 'Decline this application?',
      'The student is notified right away and the decision cannot be changed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: accepting ? 'Admit' : 'Decline',
          style: accepting ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await actions.setStatus.mutateAsync({
                id: a.id,
                changes: {
                  status: accepting ? 'accepted' : 'rejected',
                  decision_message: message.trim(),
                  final_program_id: accepting ? programId : null,
                },
              });
              setDecision(null);
            } catch (e) {
              Alert.alert('Could not save decision', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={applicant.isRefetching} onRefresh={applicant.refetch} />
      }>
      <Stack.Screen options={{ title: studentName(s) }} />

      <View>
        <Text accessibilityRole="header" style={styles.title}>
          {studentName(s)}
        </Text>
        <Text style={styles.subtitle}>
          {a.program?.name}
          {a.second_program ? ` · 2nd: ${a.second_program.name}` : ''}
        </Text>
      </View>
      <StatusBadge
        label={APPLICATION_STATUS_LABELS[a.status]}
        color={applicationStatusColor(a.status, colors)}
      />

      <Card>
        <Text style={styles.cardTitle}>AI fit score</Text>
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
                  <Text key={reason} style={styles.meta}>
                    {'✓ '}
                    {reason}
                  </Text>
                ))
              : null}
          </>
        ) : (
          <Text style={styles.meta}>Not scored yet.</Text>
        )}
        <Text style={styles.meta}>Advisory only — every decision is made by a representative.</Text>
        {!decided ? (
          <Button
            variant="secondary"
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
        <Text style={styles.cardTitle}>Application summary</Text>
        {[
          ['Email', s?.profile?.email],
          ['Senior high school', s?.senior_high_school],
          ['Strand', s?.strand],
          ['General average', s?.gpa?.toString()],
          ['Mobile', s?.mobile],
          ['Location', [address.city, address.province].filter(Boolean).join(', ')],
          ['Submitted', a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : null],
        ].map(([label, value]) => (
          <View key={label} style={styles.kv}>
            <Text style={styles.kvLabel}>{label}</Text>
            <Text style={styles.kvValue}>{value || '—'}</Text>
          </View>
        ))}
        {s?.target_majors.length ? (
          <Text style={styles.meta}>Interested in: {s.target_majors.join(', ')}</Text>
        ) : null}
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
            {a.documents.filter((d) => d.review_status === 'approved').length} of{' '}
            {a.documents.length} approved
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

      {decided ? (
        <Card>
          <Text style={styles.cardTitle}>Decision sent</Text>
          {a.final_program ? (
            <Text style={styles.body}>Admitted to {a.final_program.name}</Text>
          ) : null}
          <Text style={styles.body}>{a.decision_message}</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardTitle}>Final decision</Text>
          {!allApproved ? (
            <Text style={styles.meta}>
              Approve every document before admitting. You can decline at any time.
            </Text>
          ) : null}
          <ChipGroup
            label="Decision"
            options={allApproved ? ['Admit', 'Decline'] : ['Decline']}
            selected={decision === 'accept' ? ['Admit'] : decision === 'reject' ? ['Decline'] : []}
            onChange={(next) =>
              setDecision(next[0] === 'Admit' ? 'accept' : next[0] === 'Decline' ? 'reject' : null)
            }
            max={1}
          />
          {decision === 'accept' && choices.length > 1 ? (
            <ChipGroup
              label="Admit to"
              options={choices.map((p) => p.name)}
              selected={choices.filter((p) => p.id === finalProgramId).map((p) => p.name)}
              onChange={(next) =>
                setFinalProgramId(choices.find((p) => p.name === next[0])?.id ?? null)
              }
              max={1}
            />
          ) : null}
          {decision ? (
            <>
              <TextField
                label="Message to the student"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={2000}
              />
              <Button
                label={decision === 'accept' ? 'Send admission' : 'Send decision'}
                onPress={confirmDecision}
                loading={actions.setStatus.isPending}
                disabled={!message.trim()}
              />
            </>
          ) : null}
        </Card>
      )}
    </ScrollView>
  );
}
