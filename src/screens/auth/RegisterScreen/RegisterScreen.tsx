import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { registerSchema } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createAuthStyles } from '../authStyles';

type Fields = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
};

/**
 * SDD screen 2. Self-registration is for students only; representative and
 * administrator accounts are issued by an administrator.
 */
export function RegisterScreen() {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { signUp } = useAuth();

  const [fields, setFields] = useState<Fields>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });
  const [errors, setErrors] = useState<FieldErrors<Fields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set =
    <K extends keyof Fields>(key: K) =>
    (value: Fields[K]) =>
      setFields((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit() {
    const result = validate(registerSchema, fields);
    setErrors(result.errors ?? {});
    setFormError(null);
    if (!result.data) return;

    setSubmitting(true);
    try {
      const needsVerification = await signUp(
        result.data.fullName,
        result.data.email,
        result.data.password,
      );
      if (needsVerification) {
        router.replace({ pathname: '/verify', params: { email: result.data.email } });
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormScreen>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Create your account
        </Text>
        <Text style={styles.subtitle}>Student registration</Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Full name"
          value={fields.fullName}
          onChangeText={set('fullName')}
          error={errors.fullName}
          autoComplete="name"
          textContentType="name"
        />
        <TextField
          label="Email"
          value={fields.email}
          onChangeText={set('email')}
          error={errors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextField
          label="Password"
          value={fields.password}
          onChangeText={set('password')}
          error={errors.password}
          hint="At least 8 characters with a letter and a number"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirm password"
          value={fields.confirmPassword}
          onChangeText={set('confirmPassword')}
          error={errors.confirmPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: fields.acceptedTerms }}
          onPress={() => set('acceptedTerms')(!fields.acceptedTerms)}
          style={styles.checkboxRow}>
          <Ionicons
            name={fields.acceptedTerms ? 'checkbox' : 'square-outline'}
            size={24}
            color={fields.acceptedTerms ? colors.primary : colors.textMuted}
          />
          <Text style={styles.checkboxLabel}>
            I agree to the Terms of Service and Privacy Policy, including the processing of my
            personal data under the Data Privacy Act of 2012.
          </Text>
        </Pressable>
        {errors.acceptedTerms ? <Text style={styles.errorText}>{errors.acceptedTerms}</Text> : null}

        {formError ? (
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {formError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button label="Continue" onPress={handleSubmit} loading={submitting} />
          <View style={styles.row}>
            <Text style={styles.muted}>Already have an account?</Text>
            <Button variant="link" label="Sign in" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    </FormScreen>
  );
}
