import { Text, View } from 'react-native';

import { daysUntil, deadlineLabel } from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './DeadlineMark.styles';

const URGENT_DAYS = 7;
const SOON_DAYS = 30;

/** Days left, colored by urgency; the words carry the meaning, not just the color. */
export function DeadlineMark({ date }: { date: string | null | undefined }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const label = deadlineLabel(date);
  const days = daysUntil(date);
  if (!label || days === null) return null;

  const color =
    days < 0
      ? colors.textMuted
      : days <= URGENT_DAYS
        ? colors.danger
        : days <= SOON_DAYS
          ? colors.status.underReview
          : colors.textMuted;

  return (
    <View style={styles.row}>
      <View style={[styles.mark, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}
