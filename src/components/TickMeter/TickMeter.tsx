import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './TickMeter.styles';

const TICKS = 20;

type TickMeterProps = {
  /** 0 to 100. */
  value: number;
  /** What's being measured, for screen readers. */
  label: string;
};

/** A segmented meter for match and fit scores. */
export function TickMeter({ value, label }: TickMeterProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const score = Math.max(0, Math.min(100, value));
  const filled = Math.round((score / 100) * TICKS);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(score) }}>
      {Array.from({ length: TICKS }, (_, i) => (
        <View key={i} style={[styles.tick, i < filled && styles.filled]} />
      ))}
    </View>
  );
}
