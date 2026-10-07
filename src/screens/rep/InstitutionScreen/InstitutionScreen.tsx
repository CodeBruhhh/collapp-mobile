import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { Select } from '@/components/Select';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { ToggleRow } from '@/components/ToggleRow';
import { getCities, getProvinces, PH_REGIONS } from '@/data/ph-address';
import { deadlineLabel } from '@/features/applications/status';
import type { RepCollege } from '@/features/rep/api';
import { useMyCollege, useRepActions } from '@/features/rep/hooks';
import { institutionSchema } from '@/features/rep/schemas';
import { useTheme } from '@/hooks/useTheme';
import { pickPhoto } from '@/lib/pickers';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createRepStyles } from '../repStyles';

const REGION_NAMES = PH_REGIONS.map((r) => r.region_name);

/** SDD screen 23 — institution profile builder (web: rep onboarding form). */
export function InstitutionScreen() {
  const college = useMyCollege();
  if (college.isPending) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;
  // Re-mount the form when the saved record changes so fields start from fresh data.
  return <InstitutionForm key={college.data.updated_at} college={college.data} />;
}

function InstitutionForm({ college }: { college: RepCollege }) {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const actions = useRepActions();

  const [form, setForm] = useState({
    name: college.name,
    description: college.description,
    website: college.website ?? '',
    region: college.region,
    province: college.province,
    city: college.city,
  });
  const [errors, setErrors] = useState<FieldErrors<typeof form>>({});
  const set =
    <K extends keyof typeof form>(key: K) =>
    (value: (typeof form)[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  const isPublished = college.profile_status === 'published';
  const openPrograms = college.programs.filter((p) => p.is_open).length;
  const canPublish = openPrograms > 0 && college.requirements.length > 0;

  async function save() {
    const result = validate(institutionSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data) return;
    try {
      await actions.updateCollege.mutateAsync({ id: college.id, changes: result.data });
      Alert.alert('Saved', 'Your institution profile is up to date.');
    } catch (e) {
      Alert.alert('Could not save', getErrorMessage(e));
    }
  }

  async function togglePublished(next: boolean) {
    if (next && !canPublish) {
      Alert.alert(
        'Almost there',
        'Add at least one open program and one requirement before publishing.',
      );
      return;
    }
    try {
      await actions.updateCollege.mutateAsync({
        id: college.id,
        changes: { profile_status: next ? 'published' : 'draft' },
      });
    } catch (e) {
      Alert.alert('Could not update', getErrorMessage(e));
    }
  }

  async function changeLogo() {
    try {
      const file = await pickPhoto('library');
      if (file) await actions.uploadLogo.mutateAsync([college, file]);
    } catch (e) {
      Alert.alert('Upload failed', getErrorMessage(e));
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Card>
        <ToggleRow
          label={isPublished ? 'Published' : 'Draft'}
          description={
            isPublished
              ? 'Students can find and apply to your college.'
              : 'Only you can see this profile.'
          }
          value={isPublished}
          onChange={togglePublished}
          disabled={actions.updateCollege.isPending}
        />
      </Card>

      <View style={styles.row}>
        <CollegeLogo name={college.name} logoPath={college.logo_path} size={72} />
        <View style={styles.flex}>
          <Button
            variant="secondary"
            label={college.logo_path ? 'Change logo' : 'Upload logo'}
            onPress={changeLogo}
            loading={actions.uploadLogo.isPending}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <TextField
          label="Institution name"
          value={form.name}
          onChangeText={set('name')}
          error={errors.name}
        />
        <TextField
          label="Description"
          value={form.description}
          onChangeText={set('description')}
          error={errors.description}
          multiline
          maxLength={5000}
          hint="Campus overview, strengths, and what makes you different."
        />
        <TextField
          label="Website (optional)"
          value={form.website}
          onChangeText={set('website')}
          error={errors.website}
          placeholder="https://"
          autoCapitalize="none"
          keyboardType="url"
        />
        <Select
          label="Region"
          value={form.region}
          options={REGION_NAMES}
          onChange={(region) => setForm((f) => ({ ...f, region, province: null, city: null }))}
          error={errors.region}
        />
        <Select
          label="Province"
          value={form.province}
          options={form.region ? getProvinces(form.region).map((p) => p.province_name) : []}
          onChange={(province) => setForm((f) => ({ ...f, province, city: null }))}
          disabled={!form.region}
        />
        <Select
          label="City / Municipality"
          value={form.city}
          options={
            form.region && form.province
              ? getCities(form.region, form.province).map((c) => c.city_name)
              : []
          }
          onChange={set('city')}
          disabled={!form.province}
        />
        <Button label="Save profile" onPress={save} loading={actions.updateCollege.isPending} />
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Programs</Text>
          <Button
            variant="link"
            label="Add program"
            onPress={() => router.push({ pathname: '/rep/program/[id]', params: { id: 'new' } })}
          />
        </View>
        {college.programs.length === 0 ? (
          <Text style={styles.meta}>No programs yet.</Text>
        ) : (
          college.programs.map((p) => (
            <Card
              key={p.id}
              onPress={() => router.push({ pathname: '/rep/program/[id]', params: { id: p.id } })}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  <Text style={styles.meta}>
                    {p.is_open ? 'Open' : 'Closed'}
                    {p.deadline ? ` · Deadline ${p.deadline} (${deadlineLabel(p.deadline)})` : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          ))
        )}
      </View>

      <Card onPress={() => router.push('/rep/requirements')}>
        <View style={styles.rowBetween}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Admission requirements</Text>
            <Text style={styles.meta}>
              {college.requirements.length} requirement
              {college.requirements.length === 1 ? '' : 's'} · documents and essays
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>
    </ScrollView>
  );
}
