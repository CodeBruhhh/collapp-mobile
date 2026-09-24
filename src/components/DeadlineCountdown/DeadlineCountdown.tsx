import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { countdownLabel, daysUntil, formatDate } from '@/utils/dates';

import { createStyles } from './DeadlineCountdown.styles';

/** Shows a deadline date and how long is left; turns red when it is close or past. */
export function DeadlineCountdown({ deadline }: { deadline: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const days = daysUntil(deadline);
  const color = days <= 3 ? colors.danger : colors.textMuted;

  return (
    <View style={styles.row}>
      <Ionicons name="time-outline" size={16} color={color} />
      <Text style={[styles.text, { color }]}>
        Due {formatDate(deadline)} {'\u00B7'} {countdownLabel(days)}
      </Text>
    </View>
  );
}
