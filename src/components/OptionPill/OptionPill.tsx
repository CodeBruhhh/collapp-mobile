import { Pressable, Text } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './OptionPill.styles';

type OptionPillProps = {
  /** What the option controls, e.g. "Program". */
  label: string;
  /** The current choice, e.g. "All programs". */
  value: string;
  onPress: () => void;
  /** Highlighted when it narrows the list (anything but the default). */
  active?: boolean;
  disabled?: boolean;
};

/** Compact "Label · value ▾" button that opens a picker; sits in a toolbar row. */
export function OptionPill({ label, value, onPress, active, disabled }: OptionPillProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      accessibilityHint="Opens a list of choices"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, active && styles.textActive]}>{label}</Text>
      <Text style={[styles.value, active && styles.textActive]} numberOfLines={1}>
        {value}
      </Text>
      <Icon name="chevron-down" size={14} color={active ? colors.primary : colors.textMuted} />
    </Pressable>
  );
}
