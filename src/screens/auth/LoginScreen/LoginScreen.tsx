import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { loginSchema } from '@/features/auth/schemas';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage, validate, type FieldErrors } from '@/lib/validation';

import { createAuthStyles } from '../authStyles';

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
    <FormScreen centered>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.brand}>
          CollApp
        </Text>
        <Text style={[styles.subtitle, styles.centeredText]}>
          Your college applications, in one app.
        </Text>
      </View>

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
          <Button
            label="Create a student account"
            variant="secondary"
            onPress={() => router.push('/register')}
          />
        </View>
      </View>
    </FormScreen>
  );
}
