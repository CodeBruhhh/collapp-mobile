import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SummaryCard.styles';

type SummaryCardProps = {
  label: string;
  value: number;
  /** Optional accent for the value, e.g. a status color. */
  accent?: string;
};

export function SummaryCard({ label, value, accent }: SummaryCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.card}>
      <Text style={[styles.value, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
