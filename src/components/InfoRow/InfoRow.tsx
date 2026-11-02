import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './InfoRow.styles';

/** Label with a value underneath; shows "Not set" when the value is empty. */
export function InfoRow({ label, value }: { label: string; value?: string }) {
  const { colors, tokens } = useTheme();
  const styles = createStyles(colors);
  const hasValue = Boolean(value && value.trim());
  const shown = hasValue ? value : 'Not set';

  if (tokens.editorial) {
    return (
      <View style={styles.ledgerRow} accessible accessibilityLabel={`${label}: ${shown}`}>
        <Text style={styles.label}>{label}</Text>
        <Text style={hasValue ? styles.ledgerValue : styles.empty} numberOfLines={1}>
          {shown}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={hasValue ? styles.value : styles.empty}>{shown}</Text>
    </View>
  );
}
