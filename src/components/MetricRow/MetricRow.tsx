import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './MetricRow.styles';

type Metric = { label: string; value: string | number };

/** A ruled column of label and figure pairs; sits beside a MetricPanel. */
export function MetricRows({ metrics }: { metrics: Metric[] }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.column}>
      {metrics.map((m) => (
        <View
          key={m.label}
          style={styles.row}
          accessible
          accessibilityLabel={`${m.label}: ${m.value}`}>
          <Text style={styles.label} numberOfLines={1}>
            {m.label}
          </Text>
          <Text style={styles.value}>{m.value}</Text>
        </View>
      ))}
    </View>
  );
}
