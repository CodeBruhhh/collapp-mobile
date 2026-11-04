import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ChipGroup.styles';

type ChipGroupProps = {
  label: string;
  options: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Single-select when 1. */
  max?: number;
  hint?: string;
  error?: string;
};

/** Toggleable chips for picking one or several options (SDD screen 5 "Areas of Interest"). */
export function ChipGroup({
  label,
  options,
  selected,
  onChange,
  max,
  hint,
  error,
}: ChipGroupProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else if (max === 1) {
      onChange([option]);
    } else if (!max || selected.length < max) {
      onChange([...selected, option]);
    }
  }

  return (
    <View style={styles.root} accessibilityRole="none">
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.chips}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              key={option}
              accessibilityRole={max === 1 ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: active }}
              onPress={() => toggle(option)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
