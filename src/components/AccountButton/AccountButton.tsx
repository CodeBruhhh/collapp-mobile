import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useMyCollege } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './AccountButton.styles';

const SIZE = 32;

/** The representative's own photo, or their college's logo until they add one. */
function RepPicture() {
  const { profile } = useAuth();
  const college = useMyCollege();
  return (
    <Avatar
      name={profile?.full_name || college.data?.name || 'Representative'}
      avatarPath={profile?.avatar_path}
      logoPath={college.data?.logo_path}
      size={SIZE}
      onAccent
    />
  );
}

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
      {role === 'school_rep' ? (
        <RepPicture />
      ) : (
        <View style={styles.avatar}>
          <Icon name="person" size={17} color={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}
