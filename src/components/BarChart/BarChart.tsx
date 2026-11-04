import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { CHART_MAX_BAR, createStyles } from './BarChart.styles';

type Bar = { key: string; label: string; value: number };

/** Ruled bar chart; bars with a value take the accent, empty ones a quiet tick. */
export function BarChart({ bars, title }: { bars: Bar[]; title: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const peak = Math.max(1, ...bars.map((b) => b.value));

  return (
    <View
      style={styles.chart}
      accessible
      accessibilityLabel={`${title}: ${bars.map((b) => `${b.label}, ${b.value}`).join('; ')}`}>
      <View style={styles.plot}>
        <View style={[styles.guide, styles.upperGuide]} />
        <View style={[styles.guide, styles.baseline]} />
        {bars.map((b) => (
          <View key={b.key} style={styles.column}>
            <Text style={[styles.value, b.value > 0 && styles.valueActive]}>{b.value}</Text>
            {b.value > 0 ? (
              <View
                style={[styles.bar, styles.barActive, { height: (b.value / peak) * CHART_MAX_BAR }]}
              />
            ) : (
              <View style={styles.bar} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {bars.map((b) => (
          <Text key={b.key} style={[styles.label, b.value > 0 && styles.labelActive]}>
            {b.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
