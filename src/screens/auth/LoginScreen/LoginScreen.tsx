import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { AuthLayout } from '../AuthLayout';
import { createAuthStyles } from '../authStyles';
import { GoogleButton } from '../GoogleButton';

/** SDD screen 1. Email/password sign-in; reps and admins use accounts issued by an admin. */
export function LoginScreen() {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<{ email: string; password: string }>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const result = validate(loginSchema, { email, password });
    setErrors(result.errors ?? {});
    setFormError(null);
    if (!result.data) return;

    setSubmitting(true);
    try {
      await signIn(result.data.email, result.data.password);
    } catch (error) {
      const message = getErrorMessage(error);
      if (/email not confirmed/i.test(message)) {
        router.push({ pathname: '/verify', params: { email: result.data.email } });
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      brand
      eyebrow="College applications"
      subtitle="Your college applications, in one app.">
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          placeholder="Enter your password"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <View style={styles.rowEnd}>
          <Button
            variant="link"
            label="Forgot password?"
            onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
          />
        </View>

        {formError ? (
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {formError}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Button label="Sign in" onPress={handleSubmit} loading={submitting} />
          <GoogleButton onError={setFormError} />
        </View>
      </View>

      <View style={styles.push}>
        <View style={styles.row}>
          <Text style={styles.muted}>New here?</Text>
          <Button
            variant="link"
            label="Create a student account"
            onPress={() => router.push('/register')}
          />
        </View>
      </View>
    </AuthLayout>
  );
}
