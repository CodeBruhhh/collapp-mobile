import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { Select } from '@/components/Select';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { ToggleRow } from '@/components/ToggleRow';
import type { Requirement } from '@/features/colleges/api';
import { useCollegeId, useMyCollege, useRepActions } from '@/features/rep/hooks';
import { requirementSchema, STANDARD_REQUIREMENTS } from '@/features/rep/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createRepStyles } from '../repStyles';

const ALL_PROGRAMS = 'All programs';
const KIND_LABELS = { Document: 'document', Essay: 'essay' } as const;

/** SDD screen 24 — dynamic requirement builder (SRS 3.1.2.1). */
export function RequirementsScreen() {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const collegeId = useCollegeId();
  const college = useMyCollege();
  const actions = useRepActions();

  const [form, setForm] = useState({
    label: '',
    description: '',
    kind: 'document' as 'document' | 'essay',
    is_required: true,
    program_id: null as string | null,
  });
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});

  if (college.isPending) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const { programs, requirements } = college.data;
  const programName = (id: string | null) =>
    id ? (programs.find((p) => p.id === id)?.name ?? 'Program') : ALL_PROGRAMS;
  const existingLabels = new Set(requirements.map((r) => r.label.toLowerCase()));
  const missingStandard = STANDARD_REQUIREMENTS.filter((l) => !existingLabels.has(l.toLowerCase()));
  const nextOrder = requirements.reduce((max, r) => Math.max(max, r.sort_order), 0) + 1;

  async function add(fields: typeof form) {
    const result = validate(requirementSchema, fields);
    setErrors(result.errors ?? {});
    if (!result.data) return false;
    try {
      await actions.saveRequirement.mutateAsync({
        ...result.data,
        college_id: collegeId,
        sort_order: nextOrder,
      });
      return true;
    } catch (e) {
      Alert.alert('Could not add requirement', getErrorMessage(e));
      return false;
    }
  }

  async function addCustom() {
    if (await add(form)) {
      setForm((f) => ({ ...f, label: '', description: '' }));
    }
  }

  async function toggleRequired(req: Requirement, value: boolean) {
    try {
      await actions.saveRequirement.mutateAsync({ ...req, is_required: value });
    } catch (e) {
      Alert.alert('Could not update', getErrorMessage(e));
    }
  }

  function remove(req: Requirement) {
    Alert.alert('Remove this requirement?', req.label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          actions.deleteRequirement
            .mutateAsync(req.id)
            .catch((e) => Alert.alert('Could not remove', getErrorMessage(e))),
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Admission requirements' }} />
      <Text style={styles.subtitle}>
        Students must provide every required item before they can submit.
      </Text>

      <View style={styles.section}>
        {requirements.length === 0 ? (
          <Text style={styles.meta}>No requirements yet. Start with the standard ones below.</Text>
        ) : (
          requirements.map((r) => (
            <Card key={r.id}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{r.label}</Text>
                  <Text style={styles.meta}>
                    {r.kind === 'essay' ? 'Essay' : 'Document'} · {programName(r.program_id)}
                  </Text>
                  {r.description ? <Text style={styles.meta}>{r.description}</Text> : null}
                </View>
              </View>
              <ToggleRow
                label="Required"
                value={r.is_required}
                onChange={(v) => toggleRequired(r, v)}
              />
              <Button variant="link" label="Remove" onPress={() => remove(r)} />
            </Card>
          ))
        )}
      </View>

      {missingStandard.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standard requirements</Text>
          <Text style={styles.meta}>Tap to add for all programs.</Text>
          <ChipGroup
            label="Add a standard requirement"
            options={missingStandard}
            selected={[]}
            onChange={(next) => {
              if (next[0]) {
                add({
                  label: next[0],
                  description: '',
                  kind: 'document',
                  is_required: true,
                  program_id: null,
                });
              }
            }}
          />
        </View>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>Custom requirement</Text>
        <TextField
          label="Name"
          value={form.label}
          onChangeText={(label) => setForm((f) => ({ ...f, label }))}
          error={errors.label}
          placeholder="e.g. Portfolio for Arts applicants"
        />
        <TextField
          label="Instructions (optional)"
          value={form.description}
          onChangeText={(description) => setForm((f) => ({ ...f, description }))}
          error={errors.description}
          multiline
        />
        <ChipGroup
          label="Type"
          options={Object.keys(KIND_LABELS)}
          selected={Object.entries(KIND_LABELS)
            .filter(([, v]) => v === form.kind)
            .map(([k]) => k)}
          onChange={(next) =>
            next[0] &&
            setForm((f) => ({ ...f, kind: KIND_LABELS[next[0] as keyof typeof KIND_LABELS] }))
          }
          max={1}
        />
        <Select
          label="Applies to"
          value={programName(form.program_id)}
          options={[ALL_PROGRAMS, ...programs.map((p) => p.name)]}
          onChange={(name) =>
            setForm((f) => ({
              ...f,
              program_id: programs.find((p) => p.name === name)?.id ?? null,
            }))
          }
        />
        <ToggleRow
          label="Required"
          value={form.is_required}
          onChange={(is_required) => setForm((f) => ({ ...f, is_required }))}
        />
        <Button
          label="Add requirement"
          onPress={addCustom}
          loading={actions.saveRequirement.isPending}
        />
      </Card>
    </ScrollView>
  );
}
