import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';
import { publicUrl } from '@/lib/storage';

import { createStyles } from './Avatar.styles';

type AvatarProps = {
  name: string;
  /** The person's own photo, from the avatars bucket. */
  avatarPath?: string | null;
  /** A college logo, from the public college media bucket. */
  logoPath?: string | null;
  /** Shown instead of initials, e.g. the shield for the CollApp administrator. */
  icon?: IconName;
  size?: number;
  /** Colors for sitting on the teal chat header. */
  onAccent?: boolean;
};

/** Up to two initials from a display name, e.g. "Aaron Lee Ybañez" -> "AY". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Round picture, glyph or initials; decorative, so the row around it carries the name. */
export function Avatar({ name, avatarPath, logoPath, icon, size = 56, onAccent }: AvatarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const uri = publicUrl('avatars', avatarPath) ?? publicUrl('college-media', logoPath);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, circle]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  return (
    <View
      style={[styles.fallback, onAccent && styles.fallbackOnAccent, circle]}
      accessibilityElementsHidden
      importantForAccessibility="no">
      {icon ? (
        <Icon name={icon} size={size * 0.5} color={colors.primary} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.32 }]}>{initialsOf(name)}</Text>
      )}
    </View>
  );
}
