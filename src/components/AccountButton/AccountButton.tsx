import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './AccountButton.styles';

/**
 * Header shortcut to Profile & Settings for representatives and administrators
 * (students use their Profile tab, so nothing is shown for them).
 */
export function AccountButton() {
  const { role } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles();
  if (role !== 'school_rep' && role !== 'admin') return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      onPress={() => router.push(role === 'admin' ? '/admin/account' : '/rep/account')}
      style={styles.button}>
      <Ionicons name="person-circle-outline" size={26} color={colors.text} />
    </Pressable>
  );
}
