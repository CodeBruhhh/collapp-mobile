import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import { deleteNotification, listNotifications, markNotificationsRead } from './api';

export const notificationKeys = {
  list: (userId: string) => ['notifications', userId] as const,
};

export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: notificationKeys.list(userId),
    queryFn: () => listNotifications(userId),
    enabled: Boolean(userId),
  });
}

export function useUnreadNotificationCount() {
  const { data } = useNotifications();
  return (data ?? []).filter((n) => !n.read_at).length;
}

export function useNotificationActions() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId) });

  const markRead = useMutation({
    mutationFn: (ids?: string[]) => markNotificationsRead(userId, ids),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteNotification, onSuccess: invalidate });
  return { markRead, remove };
}
