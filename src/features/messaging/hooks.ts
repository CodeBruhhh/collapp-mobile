import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import {
  getThread,
  listMessages,
  listThreads,
  markThreadRead,
  sendMessage,
  startThread,
  type Message,
  type SendMessageInput,
} from './api';

/** A message as shown in the chat: saved, or still on its way. */
export type ChatMessage = Message & { delivery?: 'sending' | 'failed' };

export const messagingKeys = {
  all: (userId: string) => ['messaging', userId] as const,
  threads: (userId: string) => ['messaging', userId, 'threads'] as const,
  thread: (userId: string, threadId: string) => ['messaging', userId, 'thread', threadId] as const,
  messages: (userId: string, threadId: string) =>
    ['messaging', userId, 'messages', threadId] as const,
};

/** Insert or replace by id, keeping the list in time order. */
export function upsertMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const index = list.findIndex((m) => m.id === message.id);
  if (index === -1) {
    return [...list, message].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  const next = list.slice();
  next[index] = { ...list[index], ...message };
  return next;
}

/** Apply a realtime row to the open conversation's cache (if it is loaded). */
export function applyRealtimeMessage(queryClient: QueryClient, userId: string, message: Message) {
  queryClient.setQueryData<ChatMessage[]>(
    messagingKeys.messages(userId, message.thread_id),
    (old) => (old ? upsertMessage(old, { ...message, delivery: undefined }) : old),
  );
}

function useUserId() {
  const { session } = useAuth();
  return session?.user.id ?? '';
}

export function useThreads() {
  const userId = useUserId();
  return useQuery({
    queryKey: messagingKeys.threads(userId),
    queryFn: listThreads,
    enabled: Boolean(userId),
  });
}

/** Total unread messages across the inbox, for the Messages tab badge. */
export function useUnreadMessageCount() {
  const { data } = useThreads();
  return (data ?? []).reduce((sum, t) => sum + t.unread_count, 0);
}

export function useThread(threadId: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: messagingKeys.thread(userId, threadId),
    queryFn: () => getThread(threadId),
    enabled: Boolean(userId && threadId),
  });
}

export function useMessages(threadId: string) {
  const userId = useUserId();
  return useQuery<ChatMessage[]>({
    queryKey: messagingKeys.messages(userId, threadId),
    queryFn: () => listMessages(threadId),
    enabled: Boolean(userId && threadId),
  });
}

/** Optimistic send: the bubble appears at once and turns red if delivery fails. */
export function useSendMessage(threadId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const key = messagingKeys.messages(userId, threadId);
  const setDelivery = (id: string, delivery: ChatMessage['delivery']) =>
    queryClient.setQueryData<ChatMessage[]>(key, (old) =>
      old?.map((m) => (m.id === id ? { ...m, delivery } : m)),
    );

  return useMutation({
    mutationFn: (input: Omit<SendMessageInput, 'threadId'>) => sendMessage({ ...input, threadId }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const optimistic: ChatMessage = {
        id: input.id,
        thread_id: threadId,
        sender_id: userId,
        body: input.body.trim(),
        attachment_path: null,
        attachment_name: input.attachment?.name ?? null,
        attachment_mime: input.attachment?.mimeType ?? null,
        scan_status: input.attachment ? 'pending' : null,
        read_at: null,
        created_at: new Date().toISOString(),
        delivery: 'sending',
      };
      queryClient.setQueryData<ChatMessage[]>(key, (old) => upsertMessage(old ?? [], optimistic));
    },
    onError: (_error, input) => setDelivery(input.id, 'failed'),
    onSuccess: (saved) =>
      queryClient.setQueryData<ChatMessage[]>(key, (old) =>
        upsertMessage(old ?? [], { ...saved, delivery: undefined }),
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: messagingKeys.threads(userId) }),
  });
}

export function useMarkThreadRead(threadId: string) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markThreadRead(threadId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.threads(userId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(userId, threadId) });
    },
  });
}

export function useStartThread() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startThread,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagingKeys.threads(userId) }),
  });
}
