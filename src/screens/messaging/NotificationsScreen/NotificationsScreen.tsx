import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterTabs } from '@/components/FilterTabs';
import { Icon, type IconName } from '@/components/Icon';
import { LedgerRow } from '@/components/LedgerRow';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import type { AppNotification } from '@/features/notifications/api';
import { useNotificationActions, useNotifications } from '@/features/notifications/hooks';
import { NOTIFICATION_ICONS, notificationTarget } from '@/features/notifications/routing';
import { useTheme } from '@/hooks/useTheme';
import { ask, notify } from '@/lib/feedback';
import { dayLabel, shortTime } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './NotificationsScreen.styles';

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
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const { role } = useAuth();
  const notifications = useNotifications();
  const { markRead, remove, clear } = useNotificationActions();
  const [filter, setFilter] = useState<Filter>('all');

  const all = notifications.data ?? [];
  const visible = all.filter(MATCHES[filter]);
  const unread = all.filter(MATCHES.unread).length;
  const read = all.length - unread;

  const fail = (title: string) => (e: unknown) => notify.error(title, getErrorMessage(e));

  function open(n: AppNotification) {
    if (!n.read_at) markRead.mutate([n.id]);
    const target = role ? notificationTarget(role, n.type, n.data) : null;
    if (target) router.push(target);
  }

  function itemOptions(n: AppNotification) {
    ask(n.title, undefined, [
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
    ask('Clear notifications?', 'This removes them from this list.', [
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
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      data={visible}
      keyExtractor={(n) => n.id}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={notifications.isRefetching}
          onRefresh={notifications.refetch}
        />
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
                      <Icon name="checkmark-done" size={22} color={colors.onPrimary} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Clear notifications"
                      onPress={confirmClear}
                      style={styles.headerButton}>
                      <Icon name="trash" size={21} color={colors.onPrimary} />
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
          <EmptyState icon="checkmark-done" title="You're all caught up" />
        ) : (
          <EmptyState
            icon="notifications"
            title={filter === 'all' ? 'No notifications' : 'Nothing here'}
            body={filter === 'all' ? 'Updates and messages will show up here.' : undefined}
          />
        )
      }
      renderItem={({ item, index }) => {
        const isUnread = !item.read_at;
        const day = dayLabel(item.created_at);
        const newDay = index === 0 || dayLabel(visible[index - 1].created_at) !== day;
        return (
          <View>
            {newDay ? (
              <Text accessibilityRole="header" style={styles.day}>
                {day}
              </Text>
            ) : null}
            <LedgerRow
              first={newDay}
              emphasis={isUnread}
              title={item.title}
              subtitle={item.body || undefined}
              onPress={() => open(item)}
              onLongPress={() => itemOptions(item)}
              accessibilityLabel={`${isUnread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
              leading={
                <View style={[styles.icon, isUnread && styles.iconUnread]}>
                  <Icon
                    name={(NOTIFICATION_ICONS[item.type] ?? 'notifications') as IconName}
                    size={18}
                    color={isUnread ? colors.primary : colors.textMuted}
                  />
                </View>
              }
              trailing={
                <View style={styles.side}>
                  <Text style={styles.time}>{shortTime(item.created_at)}</Text>
                  {isUnread ? <View style={styles.dot} accessibilityElementsHidden /> : null}
                </View>
              }
            />
          </View>
        );
      }}
    />
  );
}
