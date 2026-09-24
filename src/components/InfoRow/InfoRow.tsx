import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './InfoRow.styles';

/** Label with a value underneath; shows "Not set" when the value is empty. */
export function InfoRow({ label, value }: { label: string; value?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const hasValue = Boolean(value && value.trim());

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={hasValue ? styles.value : styles.empty}>{hasValue ? value : 'Not set'}</Text>
    </View>
  );
}
