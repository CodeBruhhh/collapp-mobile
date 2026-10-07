import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { applicationRequirements } from '@/features/applications/api';
import {
  useApplication,
  useApplicationActions,
  useMyApplications,
} from '@/features/applications/hooks';
import { deadlineLabel } from '@/features/applications/status';
import { requirementsFor } from '@/features/colleges/api';
import { useCollege } from '@/features/colleges/hooks';
import { fetchStudentProfile } from '@/features/profile/api';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ApplyScreen.styles';
import { RequirementUpload } from './RequirementUpload';

const STEPS = ['Programs', 'Documents', 'Review & submit'] as const;
const NO_SECOND_CHOICE = 'No second choice';

/**
 * SDD screen 8 — application form. Personal and academic details come from the
 * onboarding profile, so the wizard covers program choice, documents/essay and review.
 */
export function ApplyScreen({ collegeId }: { collegeId: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const isOnline = useIsOnline();

  const college = useCollege(collegeId);
  const myApplications = useMyApplications();
  const actions = useApplicationActions();
  const profile = useQuery({
    queryKey: ['students', userId],
    queryFn: () => fetchStudentProfile(userId),
    enabled: Boolean(userId),
  });

  // Resume an existing draft for this college if there is one.
  const existingDraft = myApplications.data?.find(
    (a) => a.college_id === collegeId && a.status === 'draft',
  );
  const [createdId, setCreatedId] = useState<string | null>(null);
  const draftId = createdId ?? existingDraft?.id ?? null;
  const draft = useApplication(draftId ?? undefined);

  const [step, setStep] = useState(0);
  const [programName, setProgramName] = useState<string | null>(null);
  const [secondName, setSecondName] = useState<string | null>(null);
  const [essay, setEssay] = useState<string | null>(null);
  const [busyRequirement, setBusyRequirement] = useState<string | null>(null);

  if (college.isPending || myApplications.isPending) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const c = college.data;
  const openPrograms = c.programs.filter((p) => p.is_open);
  const byName = (name: string | null) => openPrograms.find((p) => p.name === name) ?? null;

  // Form values fall back to the saved draft until the student edits them.
  const savedProgram = c.programs.find((p) => p.id === draft.data?.program_id) ?? null;
  const savedSecond = c.programs.find((p) => p.id === draft.data?.second_program_id) ?? null;
  const program = programName !== null ? byName(programName) : savedProgram;
  const second =
    secondName !== null
      ? secondName === NO_SECOND_CHOICE
        ? null
        : byName(secondName)
      : savedSecond;
  const essayValue = essay ?? draft.data?.essay ?? '';

  const requirements = draft.data
    ? applicationRequirements(draft.data)
    : requirementsFor(c, program?.id ?? null);
  const documentReqs = requirements.filter((r) => r.kind === 'document');
  const needsEssay = requirements.some((r) => r.kind === 'essay') || Boolean(program?.essay_prompt);
  const docFor = (reqId: string) => draft.data?.documents.find((d) => d.requirement_id === reqId);
  const missing = [
    ...documentReqs.filter((r) => r.is_required && !docFor(r.id)).map((r) => r.label),
    ...(requirements.some((r) => r.kind === 'essay' && r.is_required) && !essayValue.trim()
      ? ['Essay']
      : []),
  ];

  async function saveProgramsAndContinue() {
    if (!program) {
      Alert.alert('Choose a program', 'Pick your first-choice program to continue.');
      return;
    }
    try {
      if (!draftId) {
        const created = await actions.createDraft.mutateAsync({
          collegeId: c.id,
          programId: program.id,
          secondProgramId: second?.id ?? null,
        });
        setCreatedId(created.id);
      } else if (
        program.id !== draft.data?.program_id ||
        (second?.id ?? null) !== draft.data?.second_program_id
      ) {
        await actions.updateDraft.mutateAsync({
          id: draftId,
          changes: { program_id: program.id, second_program_id: second?.id ?? null },
        });
      }
      setStep(1);
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    }
  }

  async function saveEssayAndContinue() {
    try {
      if (draftId && essay !== null && essay !== draft.data?.essay) {
        await actions.updateDraft.mutateAsync({
          id: draftId,
          changes: { essay: essay.trim() || null },
        });
      }
      setStep(2);
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    }
  }

  async function handleSubmit() {
    if (!draftId) return;
    try {
      await actions.submit.mutateAsync(draftId);
      router.replace({ pathname: '/student/application/[id]', params: { id: draftId } });
      Alert.alert('Application submitted', `${c.name} will review your application.`);
    } catch (e) {
      Alert.alert('Not submitted yet', getErrorMessage(e));
    }
  }

  function handleDelete() {
    if (!draft.data) return;
    Alert.alert('Delete this draft?', 'Uploaded files will be removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.deleteDraft.mutateAsync(draft.data!);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  const s = profile.data;
  const address = (s?.address ?? {}) as Record<string, string | undefined>;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Application' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View
          style={styles.stepper}
          accessibilityLabel={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepBar, i <= step && styles.stepBarActive]} />
              <Text style={[styles.stepLabel, i === step && styles.stepLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        <View>
          <Text accessibilityRole="header" style={styles.title}>
            {c.name}
          </Text>
          <Text style={styles.subtitle}>
            {draftId ? 'Draft saved — you can finish later.' : 'Start your application.'}
          </Text>
        </View>

        {step === 0 ? (
          <View style={styles.section}>
            <Select
              label="First-choice program"
              value={program?.name ?? null}
              options={openPrograms.map((p) => p.name)}
              onChange={(name) => {
                setProgramName(name);
                if (second?.name === name) setSecondName(NO_SECOND_CHOICE);
              }}
            />
            {program?.deadline ? (
              <Text style={styles.meta}>
                Deadline {program.deadline} · {deadlineLabel(program.deadline)}
              </Text>
            ) : null}
            <Select
              label="Second-choice program (optional)"
              value={second?.name ?? NO_SECOND_CHOICE}
              options={[
                NO_SECOND_CHOICE,
                ...openPrograms.filter((p) => p.id !== program?.id).map((p) => p.name),
              ]}
              onChange={setSecondName}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supporting documents</Text>
            <Text style={styles.meta}>
              PDF or photos, up to 5 MB. Photos are compressed automatically.
            </Text>
            {documentReqs.map((req) => (
              <RequirementUpload
                key={req.id}
                requirement={req}
                document={docFor(req.id)}
                busy={busyRequirement === req.id}
                onUpload={async (file) => {
                  setBusyRequirement(req.id);
                  try {
                    await actions.attachDocument.mutateAsync({
                      applicationId: draftId!,
                      requirementId: req.id,
                      label: req.label,
                      file,
                      existing: docFor(req.id),
                    });
                  } finally {
                    setBusyRequirement(null);
                  }
                }}
                onRemove={async () => {
                  const doc = docFor(req.id);
                  if (doc) await actions.removeDocument.mutateAsync(doc).catch(() => {});
                }}
              />
            ))}
            {needsEssay ? (
              <TextField
                label="Essay"
                hint={program?.essay_prompt ?? 'Tell the admissions team about yourself.'}
                value={essayValue}
                onChangeText={setEssay}
                multiline
                maxLength={10000}
              />
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Card>
              <Text style={styles.sectionTitle}>From your profile</Text>
              {[
                ['Name', [s?.first_name, s?.middle_name, s?.last_name].filter(Boolean).join(' ')],
                ['Senior high school', s?.senior_high_school],
                ['Strand', s?.strand],
                ['General average', s?.gpa?.toString()],
                ['Address', [address.city, address.province].filter(Boolean).join(', ')],
              ].map(([label, value]) => (
                <View key={label} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{label}</Text>
                  <Text style={styles.summaryValue}>{value || '—'}</Text>
                </View>
              ))}
            </Card>
            <Card>
              <Text style={styles.sectionTitle}>Application</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>First choice</Text>
                <Text style={styles.summaryValue}>{program?.name ?? '—'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Second choice</Text>
                <Text style={styles.summaryValue}>{second?.name ?? 'None'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Documents</Text>
                <Text style={styles.summaryValue}>
                  {documentReqs.filter((r) => docFor(r.id)).length} of {documentReqs.length}{' '}
                  uploaded
                </Text>
              </View>
            </Card>
            {missing.length ? (
              <View style={styles.warning} accessibilityLiveRegion="polite">
                <Text style={styles.warningText}>Still needed: {missing.join(', ')}</Text>
              </View>
            ) : null}
            {!isOnline ? (
              <View style={styles.warning} accessibilityLiveRegion="polite">
                <Text style={styles.warningText}>
                  You&apos;re offline. Your draft is saved — reconnect to submit.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step === 0 ? (
          <Button
            label="Next"
            onPress={saveProgramsAndContinue}
            loading={actions.createDraft.isPending || actions.updateDraft.isPending}
            disabled={!program}
          />
        ) : null}
        {step === 1 ? (
          <Button
            label="Review"
            onPress={saveEssayAndContinue}
            loading={actions.updateDraft.isPending}
            disabled={busyRequirement !== null}
          />
        ) : null}
        {step === 2 ? (
          <Button
            label="Submit application"
            onPress={handleSubmit}
            loading={actions.submit.isPending}
            disabled={missing.length > 0 || !isOnline}
          />
        ) : null}
        <View style={styles.footerRow}>
          {step > 0 ? (
            <View style={styles.flex}>
              <Button variant="secondary" label="Back" onPress={() => setStep((v) => v - 1)} />
            </View>
          ) : null}
          {draft.data ? (
            <View style={styles.flex}>
              <Button variant="link" label="Delete draft" onPress={handleDelete} />
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
