import { Pressable, ScrollView, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './FilterTabs.styles';

export type FilterOption<T extends string> = { value: T; label: string; count?: number };

type FilterTabsProps<T extends string> = {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Horizontal, scrollable segmented filter (SDD screens 13, 20, 26). */
export function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {option.label}
              {option.count !== undefined ? ` (${option.count})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
