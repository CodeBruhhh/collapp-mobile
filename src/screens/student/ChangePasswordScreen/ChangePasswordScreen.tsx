import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { changePasswordSchema } from '@/features/auth/schemas';
import { changePassword } from '@/features/profile/api';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createStyles } from './ChangePasswordScreen.styles';

type Form = { currentPassword: string; password: string; confirmPassword: string };

/** SDD screen 18 — change the account password (current password required). */
export function ChangePasswordScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { profile } = useAuth();
  const [form, setForm] = useState<Form>({
    currentPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors<Form>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof Form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    const result = validate(changePasswordSchema, form);
    setErrors(result.errors ?? {});
    if (!result.data || !profile) return;
    setSaving(true);
    try {
      await changePassword(profile.email, result.data.currentPassword, result.data.password);
      Alert.alert('Password changed', 'Use your new password the next time you sign in.');
      router.back();
    } catch (e) {
      Alert.alert('Could not change password', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'Change password' }} />
      <View style={styles.form}>
        <Text style={styles.hint}>Use at least 8 characters with a letter and a number.</Text>
        <TextField
          label="Current password"
          value={form.currentPassword}
          onChangeText={set('currentPassword')}
          error={errors.currentPassword}
          secureTextEntry
          autoComplete="current-password"
        />
        <TextField
          label="New password"
          value={form.password}
          onChangeText={set('password')}
          error={errors.password}
          secureTextEntry
          autoComplete="new-password"
        />
        <TextField
          label="Confirm new password"
          value={form.confirmPassword}
          onChangeText={set('confirmPassword')}
          error={errors.confirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <Button label="Change password" onPress={submit} loading={saving} />
      </View>
    </FormScreen>
  );
}
