import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ProfileHeader.styles';

type ProfileHeaderProps = {
  name: string;
  email: string;
  avatarPath?: string | null;
  /** Lets the person change their photo; without it the picture is display-only. */
  onEditPhoto?: () => void;
  photoBusy?: boolean;
};

/** Photo or initials, plus name and email. */
export function ProfileHeader({
  name,
  email,
  avatarPath,
  onEditPhoto,
  photoBusy,
}: ProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {onEditPhoto ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={avatarPath ? 'Change profile photo' : 'Add profile photo'}
          accessibilityState={{ busy: photoBusy, disabled: photoBusy }}
          disabled={photoBusy}
          onPress={onEditPhoto}>
          <Avatar name={name} avatarPath={avatarPath} />
          <View style={styles.editMark}>
            {photoBusy ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Icon name="camera" size={13} color={colors.onPrimary} />
            )}
          </View>
        </Pressable>
      ) : (
        <Avatar name={name} avatarPath={avatarPath} />
      )}
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {email}
        </Text>
      </View>
    </View>
  );
}
