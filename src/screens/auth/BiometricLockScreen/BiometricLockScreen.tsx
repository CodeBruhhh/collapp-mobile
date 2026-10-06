import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormScreen } from '@/components/FormScreen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

import { createAuthStyles } from '../authStyles';

/** SDD screen 4. Shown over a restored session when biometric unlock is enabled. */
export function BiometricLockScreen() {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { unlock, signOut, profile } = useAuth();
  const [failed, setFailed] = useState(false);

  async function attempt() {
    setFailed(!(await unlock()));
  }

  // Prompt straight away so returning users unlock in one step.
  useEffect(() => {
    let active = true;
    unlock().then((ok) => {
      if (active) setFailed(!ok);
    });
    return () => {
      active = false;
    };
    // Run once on mount; re-prompting on every render would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormScreen centered>
      <View style={[styles.header, { alignItems: 'center' }]}>
        <Ionicons
          name="finger-print"
          size={72}
          color={colors.primary}
          accessibilityElementsHidden
        />
        <Text accessibilityRole="header" style={[styles.title, styles.centeredText]}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </Text>
        <Text style={[styles.subtitle, styles.centeredText]}>
          Use your device biometrics to continue.
        </Text>
      </View>
      {failed ? (
        <Text accessibilityLiveRegion="polite" style={[styles.errorText, styles.centeredText]}>
          Biometric check didn&apos;t succeed. Try again or sign in with your password.
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button label="Use biometrics" onPress={attempt} />
        <Button variant="link" label="Use password instead" onPress={signOut} />
      </View>
    </FormScreen>
  );
}
