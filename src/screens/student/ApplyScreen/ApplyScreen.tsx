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
import { useSync } from '@/context/SyncContext';
import { useOfflineDraft } from '@/features/applications/offline';
import { deadlineLabel } from '@/features/applications/status';
import { requirementsFor } from '@/features/colleges/api';
import { useCollege } from '@/features/colleges/hooks';
import { fetchStudentProfile } from '@/features/profile/api';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ApplyScreen.styles';
import { RequirementUpload } from './RequirementUpload';

const STEPS = ['Programs', 'Documents', 'Review & submit'] as const;
const NO_SECOND_CHOICE = 'No second choice';

/**
 * SDD screen 8 — application form. Personal and academic details come from the
 * onboarding profile, so the wizard covers program choice, documents/essay and review.
 * Everything saves on the device first and syncs automatically (SRS 3.1.1.4);
 * only final submission needs a connection (SRS 3.6.3).
 */
export function ApplyScreen({ collegeId }: { collegeId: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const sync = useSync();

  const college = useCollege(collegeId);
  const offline = useOfflineDraft(collegeId);
  const profile = useQuery({
    queryKey: ['students', userId],
    queryFn: () => fetchStudentProfile(userId),
    enabled: Boolean(userId),
  });

  const [step, setStep] = useState(0);
  const [programName, setProgramName] = useState<string | null>(null);
  const [secondName, setSecondName] = useState<string | null>(null);
  const [essay, setEssay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (college.isPending || offline.isLoading) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const c = college.data;
  const { draft, documents } = offline;
  const openPrograms = c.programs.filter((p) => p.is_open);
  const byName = (name: string | null) => openPrograms.find((p) => p.name === name) ?? null;

  // Form values fall back to the saved draft until the student edits them.
  const savedProgram = c.programs.find((p) => p.id === draft?.program_id) ?? null;
  const savedSecond = c.programs.find((p) => p.id === draft?.second_program_id) ?? null;
  const program = programName !== null ? byName(programName) : savedProgram;
  const second =
    secondName !== null
      ? secondName === NO_SECOND_CHOICE
        ? null
        : byName(secondName)
      : savedSecond;
  const essayValue = essay ?? draft?.essay ?? '';

  const requirements = requirementsFor(c, program?.id ?? null);
  const documentReqs = requirements.filter((r) => r.kind === 'document');
  const needsEssay = requirements.some((r) => r.kind === 'essay') || Boolean(program?.essay_prompt);
  const docFor = (reqId: string) => documents.find((d) => d.requirement_id === reqId);
  const missing = [
    ...documentReqs.filter((r) => r.is_required && !docFor(r.id)).map((r) => r.label),
    ...(requirements.some((r) => r.kind === 'essay' && r.is_required) && !essayValue.trim()
      ? ['Essay']
      : []),
  ];

  async function saveDraft(next: number) {
    if (!program) {
      Alert.alert('Choose a program', 'Pick your first-choice program to continue.');
      return;
    }
    setSaving(true);
    try {
      await offline.save({
        programId: program.id,
        secondProgramId: second?.id ?? null,
        essay: essayValue.trim() || null,
      });
      setStep(next);
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await offline.submit();
      router.replace({ pathname: '/student/application/[id]', params: { id: draft!.id } });
      Alert.alert('Application submitted', `${c.name} will review your application.`);
    } catch (e) {
      Alert.alert('Not submitted yet', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert('Delete this draft?', 'Uploaded files will be removed too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await offline.deleteDraft();
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  const syncLine = !draft
    ? 'Start your application.'
    : !draft.hasLocalChanges
      ? 'Draft saved.'
      : sync.status === 'offline'
        ? 'Saved on this device. It will sync when you’re back online.'
        : sync.status === 'syncing'
          ? 'Saving to your account…'
          : 'Saved on this device.';

  const s = profile.data;
  const address = (s?.address ?? {}) as Record<string, string | undefined>;
  const conflictProgram = draft?.conflict
    ? c.programs.find((p) => p.id === draft.conflict!.program_id)?.name
    : null;

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
          <Text style={styles.subtitle} accessibilityLiveRegion="polite">
            {syncLine}
          </Text>
        </View>

        {draft?.conflict ? (
          <View style={styles.warning} accessibilityLiveRegion="polite">
            <Text style={styles.warningText}>
              This draft was changed on another device while you were offline (saved version:{' '}
              {conflictProgram ?? 'a different program'}). Which version should we keep?
            </Text>
            <View style={styles.footerRow}>
              <View style={styles.flex}>
                <Button label="Keep mine" onPress={() => offline.resolveConflict('mine')} />
              </View>
              <View style={styles.flex}>
                <Button
                  variant="secondary"
                  label="Use saved version"
                  onPress={() => {
                    setProgramName(null);
                    setSecondName(null);
                    setEssay(null);
                    offline.resolveConflict('server');
                  }}
                />
              </View>
            </View>
          </View>
        ) : draft?.syncError ? (
          <View style={styles.warning}>
            <Text style={styles.warningText}>Couldn&apos;t sync yet: {draft.syncError}</Text>
          </View>
        ) : null}

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
              Scan with your camera or attach a PDF/photo (up to 5 MB). Scans are compressed under 2
              MB. You can do this offline.
            </Text>
            {documentReqs.map((req) => (
              <RequirementUpload
                key={req.id}
                requirement={req}
                document={docFor(req.id)}
                onUpload={(file) => offline.attach(req, file, docFor(req.id))}
                onRemove={async () => {
                  const doc = docFor(req.id);
                  if (doc) await offline.removeDocument(doc);
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
                  {documentReqs.filter((r) => docFor(r.id)).length} of {documentReqs.length} added
                </Text>
              </View>
            </Card>
            {missing.length ? (
              <View style={styles.warning} accessibilityLiveRegion="polite">
                <Text style={styles.warningText}>Still needed: {missing.join(', ')}</Text>
              </View>
            ) : null}
            {!sync.isOnline ? (
              <View style={styles.warning} accessibilityLiveRegion="polite">
                <Text style={styles.warningText}>
                  You&apos;re offline. Everything is saved on this device — reconnect to submit.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step === 0 ? (
          <Button label="Next" onPress={() => saveDraft(1)} loading={saving} disabled={!program} />
        ) : null}
        {step === 1 ? (
          <Button label="Review" onPress={() => saveDraft(2)} loading={saving} />
        ) : null}
        {step === 2 ? (
          <Button
            label="Submit application"
            onPress={handleSubmit}
            loading={saving}
            disabled={missing.length > 0 || !sync.isOnline || Boolean(draft?.conflict)}
          />
        ) : null}
        <View style={styles.footerRow}>
          {step > 0 ? (
            <View style={styles.flex}>
              <Button variant="secondary" label="Back" onPress={() => setStep((v) => v - 1)} />
            </View>
          ) : null}
          {draft ? (
            <View style={styles.flex}>
              <Button variant="link" label="Delete draft" onPress={handleDelete} />
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
