import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={handlePress}
        style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color={colors.text} />
            <Text style={styles.googleLabel}>Continue with Google</Text>
          </>
        )}
      </Pressable>
      <Text style={[styles.muted, styles.centeredText]}>
        New to CollApp? Continuing with Google creates a student account and means you accept the
        Terms and Privacy Policy.
      </Text>
    </>
  );
}
