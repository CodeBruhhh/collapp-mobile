import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ProfileHeader.styles';

type ProfileHeaderProps = { name: string; email: string };

/** Up to two initials from a display name, e.g. "Aaron Lee Ybañez" -> "AY". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Initials avatar plus name and email (profile photos are not collected). */
export function ProfileHeader({ name, email }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.initials}>{initialsOf(name)}</Text>
      </View>
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
