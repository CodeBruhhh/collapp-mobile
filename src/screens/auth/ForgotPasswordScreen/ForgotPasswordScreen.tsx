import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { forgotPasswordSchema, OTP_MAX_LENGTH, resetPasswordSchema } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createAuthStyles } from '../authStyles';

type ResetFields = { code: string; password: string; confirmPassword: string };

/** Two steps: email a one-time recovery code, then set a new password with it. */
export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { sendPasswordReset, resetPassword } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(params.email ?? '');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [fields, setFields] = useState<ResetFields>({
    code: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors<ResetFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest() {
    const result = validate(forgotPasswordSchema, { email });
    setEmailError(result.errors?.email);
    setFormError(null);
    if (!result.data) return;

    setSubmitting(true);
    try {
      await sendPasswordReset(result.data.email);
      setEmail(result.data.email);
      setStep('reset');
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    const result = validate(resetPasswordSchema, fields);
    setErrors(result.errors ?? {});
    setFormError(null);
    if (!result.data) return;

    setSubmitting(true);
    try {
      // Success signs the user in; the root navigator takes over from here.
      await resetPassword(email, result.data.code, result.data.password);
    } catch (e) {
      setFormError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const set = (key: keyof ResetFields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  return (
    <FormScreen>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Reset your password
        </Text>
        <Text style={styles.subtitle}>
          {step === 'request'
            ? 'Enter your account email and we will send you a one-time code.'
            : `Enter the code we sent to ${email} and choose a new password.`}
        </Text>
      </View>

      <View style={styles.form}>
        {step === 'request' ? (
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            onSubmitEditing={handleRequest}
          />
        ) : (
          <>
            <TextField
              label="Code"
              value={fields.code}
              onChangeText={(v) => set('code')(v.replace(/[^0-9]/g, ''))}
              error={errors.code}
              keyboardType="number-pad"
              maxLength={OTP_MAX_LENGTH}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
            />
            <TextField
              label="New password"
              value={fields.password}
              onChangeText={set('password')}
              error={errors.password}
              hint="At least 8 characters with a letter and a number"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="Confirm new password"
              value={fields.confirmPassword}
              onChangeText={set('confirmPassword')}
              error={errors.confirmPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          </>
        )}

        {formError ? (
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {formError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {step === 'request' ? (
            <Button label="Send code" onPress={handleRequest} loading={submitting} />
          ) : (
            <>
              <Button label="Set new password" onPress={handleReset} loading={submitting} />
              <Button variant="link" label="Send a new code" onPress={handleRequest} />
            </>
          )}
          <Button variant="link" label="Back to sign in" onPress={() => router.back()} />
        </View>
      </View>
    </FormScreen>
  );
}
