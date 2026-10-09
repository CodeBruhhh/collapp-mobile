import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { ToggleRow } from '@/components/ToggleRow';
import type { Program } from '@/features/colleges/api';
import { SHS_STRANDS } from '@/features/profile/constants';
import { useCollegeId, useMyCollege, useRepActions } from '@/features/rep/hooks';
import { programSchema } from '@/features/rep/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createRepStyles } from '../repStyles';

/** Create or edit one program (SDD screen 23 "Programs", screen 24 deadline/prerequisites). */
export function ProgramEditorScreen({ id }: { id: string }) {
  const college = useMyCollege();
  if (college.isPending) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;
  const program = id === 'new' ? null : college.data.programs.find((p) => p.id === id);
  if (id !== 'new' && !program) return <ErrorState error={new Error('Program not found.')} />;
  return <ProgramForm program={program ?? null} />;
}

const str = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

function ProgramForm({ program }: { program: Program | null }) {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const collegeId = useCollegeId();
  const actions = useRepActions();

  const [form, setForm] = useState({
    name: program?.name ?? '',
    degree: program?.degree ?? '',
    description: program?.description ?? '',
    deadline: program?.deadline ?? '',
    tuition_per_year: str(program?.tuition_per_year),
    slots: str(program?.slots),
    min_gpa: str(program?.min_gpa),
    strands: program?.strands ?? [],
    essay_prompt: program?.essay_prompt ?? '',
    prerequisites: program?.prerequisites ?? '',
    is_open: program?.is_open ?? true,
  });
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});
  const set =
    <K extends keyof typeof form>(key: K) =>
    (value: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    const result = validate(programSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data) return;
    try {
      await actions.saveProgram.mutateAsync({
        ...result.data,
        id: program?.id,
        college_id: collegeId,
      });
      router.back();
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    }
  }

  function remove() {
    if (!program) return;
    Alert.alert('Delete this program?', program.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.deleteProgram.mutateAsync(program.id);
            router.back();
          } catch (e) {
            Alert.alert('Could not delete', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: program ? 'Edit program' : 'New program' }} />
      <ToggleRow
        label="Accepting applications"
        description="Closed programs stay visible but can't be applied to."
        value={form.is_open}
        onChange={set('is_open')}
      />
      <TextField
        label="Program name"
        value={form.name}
        onChangeText={set('name')}
        error={errors.name}
        placeholder="Bachelor of Science in Computer Science"
      />
      <TextField
        label="Degree (optional)"
        value={form.degree}
        onChangeText={set('degree')}
        error={errors.degree}
        placeholder="BS, BA, BSEd…"
      />
      <TextField
        label="Description"
        value={form.description}
        onChangeText={set('description')}
        error={errors.description}
        multiline
      />
      <TextField
        label="Application deadline (optional)"
        value={form.deadline}
        onChangeText={set('deadline')}
        error={errors.deadline}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="Tuition / year (₱)"
            value={form.tuition_per_year}
            onChangeText={set('tuition_per_year')}
            error={errors.tuition_per_year}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Slots"
            value={form.slots}
            onChangeText={set('slots')}
            error={errors.slots}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <TextField
        label="Minimum general average (optional)"
        value={form.min_gpa}
        onChangeText={set('min_gpa')}
        error={errors.min_gpa}
        keyboardType="decimal-pad"
        hint="Used by the AI fit score."
      />
      <ChipGroup
        label="Preferred SHS strands"
        hint="Used by AI recommendations and fit scoring."
        options={SHS_STRANDS}
        selected={form.strands}
        onChange={set('strands')}
      />
      <TextField
        label="Essay prompt (optional)"
        value={form.essay_prompt}
        onChangeText={set('essay_prompt')}
        error={errors.essay_prompt}
        multiline
      />
      <TextField
        label="Prerequisite notes (optional)"
        value={form.prerequisites}
        onChangeText={set('prerequisites')}
        error={errors.prerequisites}
        multiline
      />
      <Button label="Save program" onPress={save} loading={actions.saveProgram.isPending} />
      {program ? <Button variant="link" label="Delete program" onPress={remove} /> : null}
    </ScrollView>
  );
}
