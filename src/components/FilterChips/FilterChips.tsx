import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './FilterChips.styles';

export type ChipOption<T extends string> = { value: T; label: string };

type FilterChipsProps<T extends string> = {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

/** Single-select horizontal chip row (an equal-width segmented control in the editorial theme). */
export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
}: FilterChipsProps<T>) {
  const { colors, tokens } = useTheme();
  const styles = createStyles(colors, tokens);

  if (tokens.editorial) {
    return (
      <View style={styles.segments} accessibilityRole="radiogroup">
        {options.map((option) => {
          const isSelected = option.value === selected;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onSelect(option.value)}
              style={[styles.segment, isSelected && styles.segmentSelected]}>
              <Text style={[styles.segmentLabel, isSelected && styles.segmentLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
