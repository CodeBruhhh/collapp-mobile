import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ProfileHeader.styles';

type ProfileHeaderProps = { name: string; email: string };

/** Initials avatar plus name and email (profile photos are not collected). */
export function ProfileHeader({ name, email }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Avatar name={name} />
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
