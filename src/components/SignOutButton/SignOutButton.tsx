import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SignOutButton.styles';

/**
 * DEV ONLY header button. The SDD calls for a profile dropdown with settings
 * and a notification bell; replace this once those exist.
 */
export function SignOutButton() {
  const { signOut } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Sign out"
      onPress={signOut}
      style={styles.button}>
      <Ionicons name="log-out-outline" size={24} color={colors.text} />
    </Pressable>
  );
}
