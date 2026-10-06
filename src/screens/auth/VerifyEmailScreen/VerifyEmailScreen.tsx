import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { OTP_MAX_LENGTH, verifySchema } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate } from '@/lib/validation';

import { createAuthStyles } from '../authStyles';

const RESEND_COOLDOWN_SECONDS = 60;

/** SDD screen 3. Confirms the one-time code Supabase emails after sign-up. */
export function VerifyEmailScreen() {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { verifyEmail, resendVerification } = useAuth();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleVerify() {
    const result = validate(verifySchema, { code });
    setError(result.errors?.code);
    if (!result.data) return;

    setSubmitting(true);
    try {
      // On success the auth listener signs the user in and the router moves on.
      await verifyEmail(email, result.data.code);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setNotice(null);
    try {
      await resendVerification(email);
      setNotice('A new code is on its way.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <FormScreen>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Verify your email
        </Text>
        <Text style={styles.subtitle}>We sent a verification code to {email || 'your email'}.</Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="Verification code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ''))}
          error={error}
          keyboardType="number-pad"
          maxLength={OTP_MAX_LENGTH}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          returnKeyType="done"
          onSubmitEditing={handleVerify}
        />

        {notice ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{notice}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button label="Verify" onPress={handleVerify} loading={submitting} />
          <Button
            variant="link"
            label={cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            onPress={handleResend}
            disabled={cooldown > 0 || !email}
          />
          <Button variant="link" label="Use a different email" onPress={() => router.back()} />
        </View>
      </View>
    </FormScreen>
  );
}
