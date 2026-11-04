import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createAuthStyles } from './authStyles';

/** "or" divider plus Continue with Google (students; reps and admins use issued accounts). */
export function GoogleButton({ onError }: { onError: (message: string | null) => void }) {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handlePress() {
    onError(null);
    setBusy(true);
    try {
      // On success the root navigator moves on by itself (onboarding or home).
      await signInWithGoogle();
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no">
        <View style={styles.dividerLine} />
        <Text style={styles.muted}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      <Button
        variant="secondary"
        icon="logo-google"
        label="Continue with Google"
        onPress={handlePress}
        loading={busy}
      />
    </>
  );
}
