import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { useUnreadNotificationCount } from '@/features/notifications/hooks';
import { notificationsRoute } from '@/features/notifications/routing';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './NotificationBell.styles';

/** Header bell with an unread badge (SDD screen 17). */
export function NotificationBell() {
  const { role } = useAuth();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const unread = useUnreadNotificationCount();
  if (!role) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      onPress={() => router.push(notificationsRoute(role))}
      style={styles.button}>
      <Icon name="notifications" size={19} color={colors.onPrimary} />
      {unread ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
