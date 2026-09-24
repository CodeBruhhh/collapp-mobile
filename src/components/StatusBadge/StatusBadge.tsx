import { Text, View } from 'react-native';

import { STATUS_META } from '@/constants/applicationStatus';
import { useTheme } from '@/hooks/useTheme';
import type { ApplicationStatus } from '@/types/models';

import { createStyles } from './StatusBadge.styles';

/** Milestone badge. Uses a text label as well as color so it never relies on color alone. */
export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const meta = STATUS_META[status];
  const color = colors.status[meta.colorKey];

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{meta.label}</Text>
    </View>
  );
}
