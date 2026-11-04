import { ActivityIndicator, Pressable, Text } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ActionRow.styles';

type ActionRowProps = {
  label: string;
  icon: IconName;
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
      <Icon name={icon} size={16} color={colors.primary} />
      <Text style={styles.label}>{label}</Text>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Icon name="chevron-forward" size={16} color={colors.textMuted} />
      )}
    </Pressable>
  );
}
