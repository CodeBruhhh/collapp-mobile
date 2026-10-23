import * as Crypto from 'expo-crypto';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { Select } from '@/components/Select';
import { TextField } from '@/components/TextField';
import { getCities, getProvinces, PH_REGIONS } from '@/data/ph-address';
import { useAdminActions } from '@/features/admin/hooks';
import { createCollegeSchema } from '@/features/admin/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createAdminStyles } from '../adminStyles';

const REGION_NAMES = PH_REGIONS.map((r) => r.region_name);
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A readable temporary password with letters and digits (meets the password rules). */
function generatePassword(): string {
  const bytes = Crypto.getRandomBytes(14);
  const body = Array.from(bytes, (b) => PASSWORD_CHARS[b % PASSWORD_CHARS.length]).join('');
  return `${body.slice(0, 7)}-${body.slice(7)}${(bytes[0] % 8) + 2}`;
}

type Form = {
  name: string;
  description: string;
  website: string;
  region: string | null;
  province: string | null;
  city: string | null;
  repName: string;
  repEmail: string;
  repPassword: string;
};

/** SDD screen 28 — add a college (tenant) and its first representative. Reps never self-register. */
export function CreateCollegeScreen() {
  const { colors } = useTheme();
  const styles = createAdminStyles(colors);
  const { addCollege } = useAdminActions();
  const [form, setForm] = useState<Form>(() => ({
    name: '',
    description: '',
    website: '',
    region: null,
    province: null,
    city: null,
    repName: '',
    repEmail: '',
    repPassword: generatePassword(),
  }));
  const [errors, setErrors] = useState<FieldErrors<Form>>({});

  const set =
    <K extends keyof Form>(key: K) =>
    (value: Form[K]) =>
      setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    const result = validate(createCollegeSchema, {
      ...form,
      region: form.region ?? '',
      province: form.province ?? '',
      city: form.city ?? '',
    });
    setErrors(result.errors ?? {});
    if (!result.data) return;
    const d = result.data;
    try {
      await addCollege.mutateAsync({
        college: {
          name: d.name,
          description: d.description,
          website: d.website,
          region: d.region,
          province: d.province,
          city: d.city,
        },
        rep: { fullName: d.repName, email: d.repEmail, password: d.repPassword },
      });
      Alert.alert(
        'College created',
        `${d.name} starts as a draft. Share these sign-in details with the representative securely:\n\n${d.repEmail}\n${d.repPassword}`,
        [
          {
            text: 'Share details',
            onPress: () =>
              Share.share({
                message: `Your CollApp representative account for ${d.name}\nEmail: ${d.repEmail}\nTemporary password: ${d.repPassword}\nPlease change it after signing in (Settings › Change password).`,
              }).finally(() => router.back()),
          },
          { text: 'Done', onPress: () => router.back() },
        ],
      );
    } catch (e) {
      Alert.alert('Could not create the college', getErrorMessage(e));
    }
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Add college' }} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>College</Text>
        <TextField
          label="College name"
          value={form.name}
          onChangeText={set('name')}
          error={errors.name}
        />
        <TextField
          label="Description (optional)"
          value={form.description}
          onChangeText={set('description')}
          error={errors.description}
          multiline
        />
        <TextField
          label="Website (optional)"
          value={form.website}
          onChangeText={set('website')}
          error={errors.website}
          placeholder="https://"
          keyboardType="url"
          autoCapitalize="none"
        />
        <Select
          label="Region (optional)"
          value={form.region}
          options={REGION_NAMES}
          onChange={(region) => setForm((f) => ({ ...f, region, province: null, city: null }))}
        />
        <Select
          label="Province (optional)"
          value={form.province}
          options={form.region ? getProvinces(form.region).map((p) => p.province_name) : []}
          onChange={(province) => setForm((f) => ({ ...f, province, city: null }))}
          disabled={!form.region}
          placeholder={form.region ? 'Select…' : 'Select a region first'}
        />
        <Select
          label="City / Municipality (optional)"
          value={form.city}
          options={
            form.region && form.province
              ? getCities(form.region, form.province).map((c) => c.city_name)
              : []
          }
          onChange={set('city')}
          disabled={!form.province}
          placeholder={form.province ? 'Select…' : 'Select a province first'}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>First representative</Text>
        <Text style={styles.meta}>
          The account is ready to use right away; ask them to change the password after signing in.
        </Text>
        <TextField
          label="Full name"
          value={form.repName}
          onChangeText={set('repName')}
          error={errors.repName}
          autoComplete="off"
        />
        <TextField
          label="Email"
          value={form.repEmail}
          onChangeText={set('repEmail')}
          error={errors.repEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="off"
        />
        <TextField
          label="Temporary password"
          value={form.repPassword}
          onChangeText={set('repPassword')}
          error={errors.repPassword}
          autoCapitalize="none"
          autoComplete="off"
        />
        <Button
          variant="link"
          label="Generate a new password"
          onPress={() => set('repPassword')(generatePassword())}
        />
      </View>

      <Button label="Create college" onPress={submit} loading={addCollege.isPending} />
    </FormScreen>
  );
}
