import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { applyRealtimeMessage, messagingKeys } from '@/features/messaging/hooks';
import type { Message } from '@/features/messaging/api';
import { markNotificationsRead } from '@/features/notifications/api';
import { notificationKeys, useUnreadNotificationCount } from '@/features/notifications/hooks';
import { notificationTarget } from '@/features/notifications/routing';
import { registerForPush } from '@/lib/push';
import { supabase } from '@/lib/supabase';

/** Push taps already acted on (a response stays "last" until another arrives). */
const handledResponses = new Set<string>();

/**
 * Keeps a signed-in session live (SRS 3.1.4): one Realtime channel feeds open
 * chats, the inbox and the notification bell; the device registers for push;
 * tapping a push opens the related screen. Renders nothing.
 */
export function LiveUpdates() {
  const { session, role } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const lastResponse = Notifications.useLastNotificationResponse();
  const unread = useUnreadNotificationCount();

  useEffect(() => {
    if (!userId) return;
    // RLS limits these events to rows the user may read.
    const channel = supabase
      .channel(`live:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType !== 'DELETE') {
          applyRealtimeMessage(queryClient, userId, payload.new as Message);
        }
        queryClient.invalidateQueries({ queryKey: messagingKeys.threads(userId) });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  useEffect(() => {
    if (!userId) return;
    registerForPush().catch((e) => console.warn('Push registration unavailable:', e));
  }, [userId]);

  useEffect(() => {
    Notifications.setBadgeCountAsync(unread).catch(() => {});
  }, [unread]);

  useEffect(() => {
    if (!lastResponse || !role) return;
    const id = lastResponse.notification.request.identifier;
    if (handledResponses.has(id)) return;
    handledResponses.add(id);

    const data = lastResponse.notification.request.content.data as Record<string, unknown>;
    const target = notificationTarget(role, String(data.type ?? ''), data);
    if (typeof data.notification_id === 'string') {
      markNotificationsRead(userId, [data.notification_id])
        .then(() => queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) }))
        .catch(() => {});
    }
    // Let the role's navigator mount first on a cold start.
    if (target) setTimeout(() => router.push(target), 0);
  }, [lastResponse, role, userId, queryClient]);

  return null;
}
