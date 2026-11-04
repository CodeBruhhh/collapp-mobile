import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
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
  const styles = createStyles(colors);
  if (role !== 'school_rep' && role !== 'admin') return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      onPress={() => router.push(role === 'admin' ? '/admin/account' : '/rep/account')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View style={styles.avatar}>
        <Icon name="person" size={17} color={colors.primary} />
      </View>
    </Pressable>
  );
}
