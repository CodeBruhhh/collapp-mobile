import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ProgressBar.styles';

type ProgressBarProps = {
  /** 0 to 1. */
  value: number;
  color?: string;
  accessibilityLabel?: string;
};

export function ProgressBar({ value, color, accessibilityLabel }: ProgressBarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%`, backgroundColor: color ?? colors.primary },
        ]}
      />
    </View>
  );
}
