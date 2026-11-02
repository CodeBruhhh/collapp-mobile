import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './AccountButton.styles';

/**
 * Header shortcut to Profile & Settings for representatives and administrators
 * (students use their Profile tab, so nothing is shown for them).
 */
export function AccountButton() {
  const { role } = useAuth();
  const { colors, tokens } = useTheme();
  const styles = createStyles(colors);
  if (role !== 'school_rep' && role !== 'admin') return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile and settings"
      onPress={() => router.push(role === 'admin' ? '/admin/account' : '/rep/account')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {tokens.editorial ? (
        <View style={styles.avatar}>
          <Image
            source={require('@/assets/images/editorial/profile.svg')}
            style={styles.glyph}
            tintColor={colors.primary}
          />
        </View>
      ) : (
        <Ionicons name="person-circle-outline" size={26} color={colors.text} />
      )}
    </Pressable>
  );
}
