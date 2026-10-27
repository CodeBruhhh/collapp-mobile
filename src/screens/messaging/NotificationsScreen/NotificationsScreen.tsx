import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/features/notifications/api';
import { useNotificationActions, useNotifications } from '@/features/notifications/hooks';
import { NOTIFICATION_ICONS, notificationTarget } from '@/features/notifications/routing';
import { useTheme } from '@/hooks/useTheme';
import { shortTime } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';

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
  const { markRead, remove, clear } = useNotificationActions();
  const [filter, setFilter] = useState<Filter>('all');

  const all = notifications.data ?? [];
  const visible = all.filter(MATCHES[filter]);
  const unread = all.filter(MATCHES.unread).length;
  const read = all.length - unread;

  const fail = (title: string) => (e: unknown) => Alert.alert(title, getErrorMessage(e));

  function open(n: AppNotification) {
    if (!n.read_at) markRead.mutate([n.id]);
    const target = role ? notificationTarget(role, n.type, n.data) : null;
    if (target) router.push(target);
  }

  function itemOptions(n: AppNotification) {
    Alert.alert(n.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      ...(n.read_at ? [] : [{ text: 'Mark as read', onPress: () => markRead.mutate([n.id]) }]),
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => remove.mutate(n.id, { onError: fail('Could not delete') }),
      },
    ]);
  }

  function confirmClear() {
    Alert.alert('Clear notifications?', 'This removes them from this list.', [
      { text: 'Cancel', style: 'cancel' },
      ...(read && unread
        ? [
            {
              text: `Clear read (${read})`,
              onPress: () => clear.mutate(true, { onError: fail('Could not clear') }),
            },
          ]
        : []),
      {
        text: 'Clear all',
        style: 'destructive' as const,
        onPress: () => clear.mutate(false, { onError: fail('Could not clear') }),
      },
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
          <Stack.Screen
            options={{
              title: 'Notifications',
              headerRight: () =>
                all.length ? (
                  <View style={styles.headerActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Mark all as read"
                      accessibilityState={{ disabled: !unread }}
                      disabled={!unread || markRead.isPending}
                      onPress={() =>
                        markRead.mutate(undefined, { onError: fail('Could not update') })
                      }
                      style={[styles.headerButton, !unread && styles.headerButtonDisabled]}>
                      <Ionicons name="checkmark-done" size={22} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear notifications"
                      onPress={confirmClear}
                      style={styles.headerButton}>
                      <Ionicons name="trash-outline" size={21} color={colors.text} />
                    </Pressable>
                  </View>
                ) : null,
            }}
          />
          <FilterTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'unread', label: 'Unread', count: unread || undefined },
              { value: 'messages', label: 'Messages' },
              { value: 'updates', label: 'Updates' },
            ]}
          />
        </View>
      }
      ListEmptyComponent={
        notifications.isPending ? (
          <LoadingState />
        ) : notifications.isError ? (
          <ErrorState error={notifications.error} onRetry={notifications.refetch} />
        ) : filter === 'unread' && all.length ? (
          <EmptyState icon="checkmark-done-outline" title="You're all caught up" />
        ) : (
          <EmptyState
            icon="notifications-outline"
            title={filter === 'all' ? 'No notifications' : 'Nothing here'}
            body={filter === 'all' ? 'Updates and messages will show up here.' : undefined}
          />
        )
      }
      renderItem={({ item }) => {
        const isUnread = !item.read_at;
        return (
          <Card
            onPress={() => open(item)}
            onLongPress={() => itemOptions(item)}
            accessibilityLabel={`${isUnread ? 'Unread. ' : ''}${item.title}. ${item.body}`}>
            <View style={styles.row}>
              <View style={[styles.icon, isUnread && styles.iconUnread]}>
                <Ionicons
                  name={(NOTIFICATION_ICONS[item.type] ?? 'notifications-outline') as IconName}
                  size={18}
                  color={isUnread ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.info}>
                <View style={styles.topLine}>
                  <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.time}>{shortTime(item.created_at)}</Text>
                </View>
                {item.body ? (
                  <Text style={styles.body} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
              </View>
              {isUnread ? <View style={styles.dot} accessibilityElementsHidden /> : null}
            </View>
          </Card>
        );
      }}
    />
  );
}
