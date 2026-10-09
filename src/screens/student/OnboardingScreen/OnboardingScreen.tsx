import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { FormScreen } from '@/components/FormScreen';
import { Select } from '@/components/Select';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { getCities, getProvinces, PH_REGIONS } from '@/data/ph-address';
import { refreshRecommendations } from '@/features/ai/api';
import { aiKeys } from '@/features/ai/hooks';
import { fetchStudentProfile, saveFullName, saveStudentProfile } from '@/features/profile/api';
import { INTEREST_OPTIONS, MAJOR_OPTIONS, SHS_STRANDS } from '@/features/profile/constants';
import { academicSchema, addressSchema, personalSchema } from '@/features/profile/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate } from '@/lib/validation';

import { createStyles } from './OnboardingScreen.styles';

const STEPS = ['Personal information', 'Permanent address', 'Academic background'] as const;
const REGION_NAMES = PH_REGIONS.map((r) => r.region_name);
const SEX_OPTIONS = { Male: 'male', Female: 'female', Other: 'other' } as const;

type Form = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  sex: 'male' | 'female' | 'other' | null;
  mobile: string;
  isInternational: boolean;
  region: string | null;
  province: string | null;
  city: string | null;
  country: string;
  street: string;
  zipCode: string;
  fullAddress: string;
  seniorHighSchool: string;
  strand: string | null;
  gpa: string;
  targetMajors: string[];
  preferredLocations: string[];
  interests: string[];
  careerGoals: string;
};

const EMPTY: Form = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  sex: null,
  mobile: '',
  isInternational: false,
  region: null,
  province: null,
  city: null,
  country: '',
  street: '',
  zipCode: '',
  fullAddress: '',
  seniorHighSchool: '',
  strand: null,
  gpa: '',
  targetMajors: [],
  preferredLocations: [],
  interests: [],
  careerGoals: '',
};

type OnboardingScreenProps = {
  /**
   * 'onboarding': first-time setup (SDD screen 5). 'edit': changing a finished
   * profile from Profile & Settings (SDD screen 18); it stays complete throughout.
   */
  mode?: 'onboarding' | 'edit';
};

/** SDD screen 5 — academic profile collected once before students can apply (SRS 3.1.1.2). */
export function OnboardingScreen({ mode = 'onboarding' }: OnboardingScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { session, profile, refreshProfile, signOut } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const editing = mode === 'edit';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saving, setSaving] = useState(false);

  // Resume a saved draft; prefill names from the sign-up full name.
  useEffect(() => {
    if (!userId) return;
    fetchStudentProfile(userId)
      .then((s) => {
        const [first = '', ...rest] = (profile?.full_name ?? '').split(' ');
        const address = (s?.address ?? {}) as Record<string, unknown>;
        setForm({
          ...EMPTY,
          firstName: s?.first_name || first,
          lastName: s?.last_name || rest.join(' '),
          middleName: s?.middle_name ?? '',
          dateOfBirth: s?.date_of_birth ?? '',
          sex: s?.sex ?? null,
          mobile: s?.mobile ?? '',
          isInternational: address.isInternational === true,
          region: (address.region as string) ?? null,
          province: (address.province as string) ?? null,
          city: (address.city as string) ?? null,
          country: (address.country as string) ?? '',
          street: (address.street as string) ?? '',
          zipCode: (address.zipCode as string) ?? '',
          fullAddress: (address.fullAddress as string) ?? '',
          seniorHighSchool: s?.senior_high_school ?? '',
          strand: s?.strand ?? null,
          gpa: s?.gpa != null ? String(s.gpa) : '',
          targetMajors: s?.target_majors ?? [],
          preferredLocations: s?.preferred_locations ?? [],
          interests: s?.interests ?? [],
          careerGoals: s?.career_goals ?? '',
        });
      })
      .catch(() => {});
  }, [userId, profile?.full_name]);

  const set =
    <K extends keyof Form>(key: K) =>
    (value: Form[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  /** Validate the current step and return the DB changes it produces. */
  function collectStep(): Record<string, unknown> | null {
    if (step === 0) {
      const r = validate(personalSchema, form);
      setErrors(r.errors ?? {});
      if (!r.data) return null;
      return {
        first_name: r.data.firstName,
        middle_name: r.data.middleName,
        last_name: r.data.lastName,
        date_of_birth: r.data.dateOfBirth,
        sex: r.data.sex,
        mobile: r.data.mobile,
      };
    }
    if (step === 1) {
      const r = validate(addressSchema, form);
      setErrors(r.errors ?? {});
      if (!r.data) return null;
      const a = r.data;
      return {
        address: a.isInternational
          ? { isInternational: true, country: a.country, fullAddress: a.fullAddress }
          : {
              isInternational: false,
              country: 'Philippines',
              region: a.region,
              province: a.province,
              city: a.city,
              street: a.street,
              zipCode: a.zipCode,
            },
      };
    }
    const r = validate(academicSchema, form);
    setErrors(r.errors ?? {});
    if (!r.data) return null;
    return {
      senior_high_school: r.data.seniorHighSchool,
      strand: r.data.strand,
      gpa: r.data.gpa,
      target_majors: r.data.targetMajors,
      preferred_locations: r.data.preferredLocations,
      interests: r.data.interests,
      career_goals: r.data.careerGoals,
    };
  }

  async function handleNext() {
    if (!userId) return;
    const changes = collectStep();
    if (!changes) return;

    const isLast = step === STEPS.length - 1;
    setSaving(true);
    try {
      // While editing, the profile is already complete; never mark it incomplete.
      await saveStudentProfile(
        userId,
        editing ? changes : { ...changes, profile_complete: isLast },
      );
      if (step === 0) {
        // Keep the account name (headers, inbox, applicant lists) in step.
        await saveFullName(
          userId,
          [form.firstName, form.middleName, form.lastName]
            .map((n) => n.trim())
            .filter(Boolean)
            .join(' '),
        );
      }
      if (!isLast) {
        setStep((s) => s + 1);
      } else if (editing) {
        await refreshProfile();
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        // Re-rank matches for the new preferences in the background.
        refreshRecommendations()
          .then(() => queryClient.invalidateQueries({ queryKey: aiKeys.recommendations(userId) }))
          .catch(() => {});
        router.back();
      } else {
        // Flips needsOnboarding; the root navigator opens the student tabs.
        await refreshProfile();
      }
    } catch (error) {
      Alert.alert('Could not save', getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const progress = (step + 1) / STEPS.length;

  return (
    <FormScreen>
      {editing ? <Stack.Screen options={{ title: 'Edit profile' }} /> : null}
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {editing ? 'Edit academic profile' : 'Academic profile'}
        </Text>
        <Text style={styles.step}>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: STEPS.length, now: step + 1 }}
          style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.subtitle}>
          This personalizes your college recommendations and pre-fills your applications.
        </Text>
      </View>

      {step === 0 ? (
        <View style={styles.form}>
          <TextField
            label="First name"
            value={form.firstName}
            onChangeText={set('firstName')}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <TextField
            label="Middle name (optional)"
            value={form.middleName}
            onChangeText={set('middleName')}
            error={errors.middleName}
            autoComplete="additional-name"
          />
          <TextField
            label="Last name"
            value={form.lastName}
            onChangeText={set('lastName')}
            error={errors.lastName}
            autoComplete="family-name"
          />
          <TextField
            label="Date of birth"
            value={form.dateOfBirth}
            onChangeText={set('dateOfBirth')}
            error={errors.dateOfBirth}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            autoComplete="birthdate-full"
            maxLength={10}
          />
          <ChipGroup
            label="Sex"
            options={Object.keys(SEX_OPTIONS)}
            selected={Object.entries(SEX_OPTIONS)
              .filter(([, v]) => v === form.sex)
              .map(([k]) => k)}
            onChange={(next) =>
              set('sex')(next[0] ? SEX_OPTIONS[next[0] as keyof typeof SEX_OPTIONS] : null)
            }
            max={1}
            error={errors.sex}
          />
          <TextField
            label="Mobile number (optional)"
            value={form.mobile}
            onChangeText={set('mobile')}
            error={errors.mobile}
            placeholder="09XXXXXXXXX"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={13}
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.form}>
          <ChipGroup
            label="Where do you live?"
            options={['Philippines', 'Outside the Philippines']}
            selected={[form.isInternational ? 'Outside the Philippines' : 'Philippines']}
            onChange={(next) => set('isInternational')(next[0] === 'Outside the Philippines')}
            max={1}
          />
          {form.isInternational ? (
            <>
              <TextField
                label="Country"
                value={form.country}
                onChangeText={set('country')}
                error={errors.country}
                autoComplete="country"
              />
              <TextField
                label="Full address"
                value={form.fullAddress}
                onChangeText={set('fullAddress')}
                error={errors.fullAddress}
                multiline
                autoComplete="street-address"
              />
            </>
          ) : (
            <>
              <Select
                label="Region"
                value={form.region}
                options={REGION_NAMES}
                onChange={(region) =>
                  setForm((f) => ({ ...f, region, province: null, city: null }))
                }
                error={errors.region}
              />
              <Select
                label="Province"
                value={form.province}
                options={form.region ? getProvinces(form.region).map((p) => p.province_name) : []}
                onChange={(province) => setForm((f) => ({ ...f, province, city: null }))}
                error={errors.province}
                disabled={!form.region}
                placeholder={form.region ? 'Select…' : 'Select a region first'}
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
                error={errors.city}
                disabled={!form.province}
                placeholder={form.province ? 'Select…' : 'Select a province first'}
              />
              <TextField
                label="Street / Barangay (optional)"
                value={form.street}
                onChangeText={set('street')}
                error={errors.street}
                autoComplete="street-address"
              />
              <TextField
                label="Zip code (optional)"
                value={form.zipCode}
                onChangeText={set('zipCode')}
                error={errors.zipCode}
                keyboardType="number-pad"
                maxLength={4}
                autoComplete="postal-code"
              />
            </>
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.form}>
          <TextField
            label="Senior high school"
            value={form.seniorHighSchool}
            onChangeText={set('seniorHighSchool')}
            error={errors.seniorHighSchool}
          />
          <Select
            label="Strand / Track"
            value={form.strand}
            options={SHS_STRANDS}
            onChange={set('strand')}
            error={errors.strand}
          />
          <TextField
            label="General weighted average"
            value={form.gpa}
            onChangeText={set('gpa')}
            error={errors.gpa}
            placeholder="e.g. 92.5"
            keyboardType="decimal-pad"
            maxLength={6}
          />
          <ChipGroup
            label="Preferred courses / majors"
            hint="Pick up to 5"
            options={MAJOR_OPTIONS}
            selected={form.targetMajors}
            onChange={set('targetMajors')}
            max={5}
            error={errors.targetMajors}
          />
          <ChipGroup
            label="Preferred campus locations"
            hint="Optional — pick up to 5 regions"
            options={REGION_NAMES}
            selected={form.preferredLocations}
            onChange={set('preferredLocations')}
            max={5}
            error={errors.preferredLocations}
          />
          <ChipGroup
            label="Areas of interest"
            options={INTEREST_OPTIONS}
            selected={form.interests}
            onChange={set('interests')}
            max={8}
            error={errors.interests}
          />
          <TextField
            label="Career goals (optional)"
            value={form.careerGoals}
            onChangeText={set('careerGoals')}
            error={errors.careerGoals}
            multiline
          />
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={step === STEPS.length - 1 ? (editing ? 'Save changes' : 'Finish') : 'Next'}
          onPress={handleNext}
          loading={saving}
        />
        {step > 0 ? (
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setStep((s) => s - 1)}
            disabled={saving}
          />
        ) : editing ? (
          <Button variant="link" label="Cancel" onPress={() => router.back()} disabled={saving} />
        ) : (
          <Button variant="link" label="Sign out" onPress={signOut} />
        )}
      </View>
    </FormScreen>
  );
}
