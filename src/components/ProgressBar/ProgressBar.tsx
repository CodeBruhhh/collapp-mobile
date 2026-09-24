import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ProgressBar.styles';

type ProgressBarProps = {
  /** 0 to 1 */
  value: number;
  color: string;
  label: string;
};

export function ProgressBar({ value, color, label }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
    </View>
  );
}
