import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { withAlpha } from '@/styles';

import { createStyles } from './StatusBadge.styles';

/** Color-coded milestone badge (SRS 3.2.2). The label carries the meaning, not just the color. */
export function StatusBadge({ label, color }: { label: string; color: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.badge, { borderColor: withAlpha(color, 0.45) }]}
      accessibilityLabel={`Status: ${label}`}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}
