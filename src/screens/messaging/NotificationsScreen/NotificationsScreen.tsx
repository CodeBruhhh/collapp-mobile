import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/features/notifications/api';
import { useNotificationActions, useNotifications } from '@/features/notifications/hooks';
import { NOTIFICATION_ICONS, notificationTarget } from '@/features/notifications/routing';
import { useTheme } from '@/hooks/useTheme';
import { shortTime } from '@/lib/time';

import { createStyles } from './NotificationsScreen.styles';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Filter = 'all' | 'unread' | 'messages' | 'updates';

const MATCHES: Record<Filter, (n: AppNotification) => boolean> = {
  all: () => true,
  unread: (n) => !n.read_at,
  messages: (n) => n.type === 'new_message',
  updates: (n) => n.type !== 'new_message',
};

/** SDD screen 17 — status updates, messages and reminders, newest first. */
export function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { role } = useAuth();
  const notifications = useNotifications();
  const { markRead, remove } = useNotificationActions();
  const [filter, setFilter] = useState<Filter>('all');

  const all = notifications.data ?? [];
  const visible = all.filter(MATCHES[filter]);
  const unread = all.filter(MATCHES.unread).length;

  function open(n: AppNotification) {
    if (!n.read_at) markRead.mutate([n.id]);
    const target = role ? notificationTarget(role, n.type, n.data) : null;
    if (target) router.push(target);
  }

  function confirmDelete(n: AppNotification) {
    Alert.alert('Delete notification?', n.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(n.id) },
    ]);
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(n) => n.id}
      refreshControl={
        <RefreshControl refreshing={notifications.isRefetching} onRefresh={notifications.refetch} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Stack.Screen options={{ title: 'Notifications' }} />
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', count: unread },
              { value: 'messages', label: 'Messages' },
              { value: 'updates', label: 'Updates' },
            ]}
          />
          {unread ? (
            <Button
              variant="link"
              label="Mark all as read"
              loading={markRead.isPending}
              onPress={() => markRead.mutate(undefined)}
            />
          ) : null}
        </View>
      }
      ListEmptyComponent={
        notifications.isPending ? (
          <LoadingState />
        ) : notifications.isError ? (
          <ErrorState error={notifications.error} onRetry={notifications.refetch} />
        ) : (
          <EmptyState
            icon="notifications-off-outline"
            title={filter === 'all' ? 'No notifications yet' : 'Nothing here'}
            body={
              filter === 'all'
                ? 'Application updates, messages and deadline reminders will appear here.'
                : undefined
            }
          />
        )
      }
      renderItem={({ item }) => {
        const isUnread = !item.read_at;
        return (
          <Card
            onPress={() => open(item)}
            accessibilityLabel={`${isUnread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
            style={isUnread ? styles.unreadCard : undefined}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Ionicons
                  name={(NOTIFICATION_ICONS[item.type] ?? 'notifications-outline') as IconName}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.info}>
                <View style={styles.topLine}>
                  <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {isUnread ? <View style={styles.dot} /> : null}
                </View>
                {item.body ? (
                  <Text style={styles.body} numberOfLines={3}>
                    {item.body}
                  </Text>
                ) : null}
                <View style={styles.topLine}>
                  <Text style={styles.time}>{shortTime(item.created_at)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Delete notification"
                    onPress={() => confirmDelete(item)}
                    style={styles.delete}>
                    <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Card>
        );
      }}
    />
  );
}
