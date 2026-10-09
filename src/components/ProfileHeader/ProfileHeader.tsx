import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ProfileHeader.styles';

type ProfileHeaderProps = { name: string; email: string };

/** Avatar placeholder plus name and email. Swap the icon for a photo later. */
export function ProfileHeader({ name, email }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
        <Ionicons name="person-outline" size={32} color={colors.textMuted} />
      </View>
      <View style={styles.text}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
    </View>
  );
}
