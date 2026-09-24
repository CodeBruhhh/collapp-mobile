import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './NotificationButton.styles';

export function NotificationButton() {
  const { colors } = useTheme();
  const styles = createStyles();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      // TODO: open the notification center (SDD: push-notification-driven alert center).
      onPress={() => {}}
      style={styles.button}>
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
    </Pressable>
  );
}