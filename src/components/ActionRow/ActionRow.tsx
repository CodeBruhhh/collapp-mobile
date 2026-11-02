import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ActionRow.styles';

type ActionRowProps = {
  label: string;
  /** A 16pt line glyph, e.g. require('@/assets/images/editorial/lock.svg'). */
  icon: number;
  onPress: () => void;
  loading?: boolean;
};

/** A ruled ledger line that opens something: accent glyph and label, chevron at the end. */
export function ActionRow({ label, icon, onPress, loading }: ActionRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, loading && styles.inactive]}>
      <Image source={icon} style={styles.icon} tintColor={colors.primary} />
      <Text style={styles.label}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Image
          source={require('@/assets/images/editorial/chevron.svg')}
          style={styles.icon}
          tintColor={colors.textMuted}
        />
      )}
    </Pressable>
  );
}
