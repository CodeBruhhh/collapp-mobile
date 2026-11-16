import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CollegeColorsToggle } from '@/components/CollegeColorsToggle';
import { CollegeLogo } from '@/components/CollegeLogo';
import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { Section } from '@/components/Section';
import { Select } from '@/components/Select';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import { ToggleRow } from '@/components/ToggleRow';
import { getCities, getProvinces, PH_REGIONS } from '@/data/ph-address';
import { deadlineLabel } from '@/features/applications/status';
import type { RepCollege } from '@/features/rep/api';
import { useMyCollege, useRepActions } from '@/features/rep/hooks';
import { institutionSchema } from '@/features/rep/schemas';
import { themeFromLogo } from '@/features/theme/logo';
import { parseCollegeTheme } from '@/features/theme/schema';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { KeyboardAwareScrollView } from '@/lib/keyboard';
import { pickPhoto } from '@/lib/pickers';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';
import { KEYBOARD_GAP } from '@/styles';

import { createScreenStyles } from '@/screens/screenStyles';

const REGION_NAMES = PH_REGIONS.map((r) => r.region_name);

/** SDD screen 23 — institution profile builder (web: rep onboarding form). */
export function InstitutionScreen() {
  const college = useMyCollege();
  if (college.isPending) return <LoadingState variant="detail" />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;
  // Re-mount the form when the saved record changes so fields start from fresh data.
  return <InstitutionForm key={college.data.updated_at} college={college.data} />;
}

function InstitutionForm({ college }: { college: RepCollege }) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
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

  const theme = parseCollegeTheme(college.theme);
  const isPublished = college.profile_status === 'published';
  const openPrograms = college.programs.filter((p) => p.is_open).length;
  const canPublish = openPrograms > 0 && college.requirements.length > 0;

  async function save() {
    const result = validate(institutionSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data) return;
    try {
      await actions.updateCollege.mutateAsync({ id: college.id, changes: result.data });
      notify.success('Saved', 'Your institution profile is up to date.');
    } catch (e) {
      notify.error('Could not save', getErrorMessage(e));
    }
  }

  async function togglePublished(next: boolean) {
    if (next && !canPublish) {
      notify.info(
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
      notify.error('Could not update', getErrorMessage(e));
    }
  }

  async function changeLogo() {
    let file: LocalFile | null;
    try {
      file = await pickPhoto('library');
      if (!file) return;
      await actions.uploadLogo.mutateAsync([college, file]);
    } catch (e) {
      notify.error('Upload failed', getErrorMessage(e));
      return;
    }
    // Page colors follow the logo until a rep customizes them.
    if (theme?.source === 'custom') return;
    try {
      const picked = await themeFromLogo(file.uri);
      await actions.updateCollege.mutateAsync({ id: college.id, changes: { theme: picked } });
      notify.success(
        'Page colors updated',
        'They now match your new logo. Adjust them under Page theme.',
      );
    } catch (e) {
      notify.info('Logo saved', `Your page colors were not changed. ${getErrorMessage(e)}`);
    }
  }

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={styles.page}
      bottomOffset={KEYBOARD_GAP}
      keyboardShouldPersistTaps="handled">
      <View style={styles.overview}>
        <PageHeading
          title={college.name}
          subtitle="What students see when they find your college."
        />
        <View style={styles.identity}>
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
      </View>

      <Section band title="Visibility">
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
      </Section>

      <Section title="Page theme">
        <LedgerRow
          title={theme ? 'Your colors' : 'CollApp colors'}
          subtitle={
            !theme
              ? college.logo_path
                ? 'Pick colors from your logo for your page'
                : 'Upload a logo to pick colors from it'
              : theme.source === 'custom'
                ? 'Customized by your team'
                : 'Picked from your logo'
          }
          leading={
            <View style={styles.swatches} accessible={false}>
              {(theme
                ? [theme.primary, theme.secondary, theme.accent]
                : [colors.primary, colors.status.submitted, colors.status.underReview]
              ).map((hex, i) => (
                <View key={i} style={[styles.swatch, { backgroundColor: hex }]} />
              ))}
            </View>
          }
          onPress={() => router.push('/rep/theme')}
        />
        <CollegeColorsToggle />
      </Section>

      <Section title="Profile">
        <View style={styles.form}>
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
      </Section>

      <Section
        title="Programs"
        trailing={{
          label: 'Add program',
          onPress: () => router.push({ pathname: '/rep/program/[id]', params: { id: 'new' } }),
        }}>
        {college.programs.length === 0 ? (
          <Text style={styles.meta}>No programs yet.</Text>
        ) : (
          college.programs.map((p) => (
            <LedgerRow
              key={p.id}
              title={p.name}
              subtitle={`${p.is_open ? 'Open' : 'Closed'}${p.deadline ? ` · Deadline ${p.deadline} (${deadlineLabel(p.deadline)})` : ''}`}
              onPress={() => router.push({ pathname: '/rep/program/[id]', params: { id: p.id } })}
            />
          ))
        )}
      </Section>

      <Section title="Admission requirements">
        <LedgerRow
          title={`${college.requirements.length} requirement${college.requirements.length === 1 ? '' : 's'}`}
          subtitle="Documents and essays"
          onPress={() => router.push('/rep/requirements')}
        />
      </Section>

      <Section title="Reviewing">
        <LedgerRow
          title="Message templates"
          subtitle="Saved wording for admissions, declines and resubmission requests"
          onPress={() => router.push('/rep/templates')}
        />
      </Section>
    </KeyboardAwareScrollView>
  );
}
