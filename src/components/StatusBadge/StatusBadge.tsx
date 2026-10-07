import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './StatusBadge.styles';

/** Color-coded milestone badge (SRS 3.2.2). The label carries the meaning, not just the color. */
export function StatusBadge({ label, color }: { label: string; color: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.badge, { borderColor: color }]} accessibilityLabel={`Status: ${label}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}
