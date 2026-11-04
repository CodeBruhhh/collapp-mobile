import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './InfoRow.styles';

/** Label and value on one ruled line; shows "Not set" when the value is empty. */
export function InfoRow({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const hasValue = Boolean(value && value.trim());
  const shown = hasValue ? value : 'Not set';

  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${shown}`}>
      <Text style={styles.label}>{label}</Text>
      <Text style={hasValue ? styles.value : styles.empty}>{shown}</Text>
    </View>
  );
}
