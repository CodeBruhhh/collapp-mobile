import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImageViewer } from '@/components/ImageViewer';
import { ChatSkeleton } from '@/components/Skeleton';
import { EmptyState, ErrorState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { attachmentUrl, newMessageId, type ThreadDetail } from '@/features/messaging/api';
import {
  messagingKeys,
  useMarkThreadRead,
  useMessages,
  useSendMessage,
  useThread,
  type ChatMessage,
} from '@/features/messaging/hooks';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';
import { pickAttachmentFile } from '@/lib/pickers';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';
import type { Role } from '@/types/roles';

import { createStyles } from './ChatScreen.styles';
import { MessageBubble } from './MessageBubble';

const MAX_LENGTH = 4000;
/** Messages closer together than this from the same sender form one group. */
const GROUP_GAP_MS = 5 * 60 * 1000;

function chatTitle(role: Role | null, thread: ThreadDetail | undefined): string {
  if (!thread) return 'Conversation';
  const studentName =
    [thread.student?.first_name, thread.student?.last_name].filter(Boolean).join(' ') || 'Student';
  if (role === 'school_rep') {
    return thread.kind === 'rep_admin' ? 'CollApp Administrator' : studentName;
  }
  if (role === 'admin' && thread.kind === 'student_rep') {
    return `${studentName} · ${thread.college?.name ?? 'College'}`;
  }
  return thread.college?.name ?? 'Conversation';
}

const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

/** Separator label: Today, Yesterday, or e.g. "Mon, Oct 26". */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Whether two neighbouring messages belong to the same visual group. */
function grouped(a: ChatMessage | undefined, b: ChatMessage): boolean {
  if (!a || a.sender_id !== b.sender_id || !sameDay(a.created_at, b.created_at)) return false;
  return Math.abs(Date.parse(a.created_at) - Date.parse(b.created_at)) < GROUP_GAP_MS;
}

type Draft = { body: string; attachment: LocalFile | null };

/** SDD screens 16 / 26 — a formal conversation with realtime delivery and read receipts. */
export function ChatScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { role, session } = useAuth();
  const userId = session?.user.id;
  const headerHeight = useHeaderHeight();
  const online = useIsOnline();

  const queryClient = useQueryClient();
  const thread = useThread(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const markRead = useMarkThreadRead(id);

  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<LocalFile | null>(null);
  // Kept so a failed bubble can be re-sent with the same id (no duplicates).
  const [sent, setSent] = useState<Record<string, Draft>>({});
  const [photo, setPhoto] = useState<{ uri: string; name: string | null } | null>(null);
  const [opening, setOpening] = useState(false);

  // Admins may audit student<->rep conversations but never take part (SRS 3.6.5).
  const readOnly = role === 'admin' && thread.data?.kind === 'student_rep';
  const list = messages.data ?? [];
  // Newest first for the inverted list (it opens at the latest message).
  const data = [...list].reverse();
  const hasUnread =
    !readOnly && list.some((m) => m.sender_id !== userId && !m.read_at && !m.delivery);
  const { mutate: markAsRead, isPending: marking, isError: markFailed } = markRead;

  useEffect(() => {
    if (hasUnread && !marking && !markFailed) markAsRead();
  }, [hasUnread, marking, markFailed, markAsRead]);

  function deliver(messageId: string, draft: Draft) {
    send.mutate({ id: messageId, body: draft.body, attachment: draft.attachment });
  }

  /** An unsent message from before a restart: its file and text are gone, so remove it. */
  function discardUnsent(messageId: string) {
    Alert.alert('Message not sent', 'This message was not delivered. Please write it again.', [
      {
        text: 'Remove',
        onPress: () =>
          queryClient.setQueryData<ChatMessage[]>(messagingKeys.messages(userId ?? '', id), (old) =>
            old?.filter((m) => m.id !== messageId),
          ),
      },
    ]);
  }

  function submit() {
    const draft = { body: body.trim(), attachment };
    if (!draft.body && !draft.attachment) return;
    const messageId = newMessageId();
    setSent((prev) => ({ ...prev, [messageId]: draft }));
    setBody('');
    setAttachment(null);
    deliver(messageId, draft);
  }

  async function attach() {
    try {
      const file = await pickAttachmentFile();
      if (file) setAttachment(file);
    } catch (e) {
      Alert.alert('Cannot attach this file', getErrorMessage(e));
    }
  }

  /** PDFs and Word files open in an in-app browser sheet, not another app. */
  async function openFile(path: string) {
    if (opening) return;
    setOpening(true);
    try {
      await WebBrowser.openBrowserAsync(await attachmentUrl(path), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (e) {
      Alert.alert('Could not open the file', getErrorMessage(e));
    } finally {
      setOpening(false);
    }
  }

  if (thread.isError) return <ErrorState error={thread.error} onRetry={thread.refetch} />;

  const canSend = online && Boolean(body.trim() || attachment);
  const attachingPhoto = attachment?.mimeType.startsWith('image/');

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}>
      <Stack.Screen options={{ title: chatTitle(role, thread.data) }} />
      {messages.isPending ? (
        <View style={styles.list}>
          <ChatSkeleton />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          inverted={data.length > 0}
          data={data}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            messages.isError ? (
              <ErrorState error={messages.error} onRetry={messages.refetch} />
            ) : (
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="Start the conversation"
                body="Messages here are formal and visible to your college's representatives and the administrator."
              />
            )
          }
          renderItem={({ item, index }) => {
            const older = data[index + 1];
            const newer = data[index - 1];
            const showDay = !older || !sameDay(older.created_at, item.created_at);
            return (
              <View>
                {showDay ? (
                  <View style={styles.day}>
                    <Text style={styles.dayText}>{dayLabel(item.created_at)}</Text>
                  </View>
                ) : null}
                <MessageBubble
                  // A bubble left "sending" by a previous app session can't finish.
                  message={
                    item.delivery === 'sending' && !sent[item.id]
                      ? { ...item, delivery: 'failed' }
                      : item
                  }
                  mine={item.sender_id === userId}
                  first={!grouped(older, item)}
                  last={!grouped(newer, item)}
                  onRetry={() => {
                    const draft = sent[item.id];
                    if (draft) deliver(item.id, draft);
                    else discardUnsent(item.id);
                  }}
                  onOpenPhoto={(uri, name) => setPhoto({ uri, name })}
                  onOpenFile={openFile}
                />
              </View>
            );
          }}
        />
      )}

      {readOnly ? (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Text style={[styles.notice, styles.readOnlyNotice]}>
            Audit view: administrators can read student conversations but not reply.
          </Text>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          {!online ? (
            <Text style={styles.notice}>You&apos;re offline. Reconnect to send messages.</Text>
          ) : null}
          {attachment ? (
            <View style={styles.pending}>
              {attachingPhoto ? (
                <Image
                  source={{ uri: attachment.uri }}
                  style={styles.pendingThumb}
                  contentFit="cover"
                  accessibilityLabel="Photo to send"
                />
              ) : (
                <View style={styles.pendingIcon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                </View>
              )}
              <Text style={styles.pendingName} numberOfLines={1}>
                {attachingPhoto ? 'Photo' : attachment.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove attachment"
                onPress={() => setAttachment(null)}
                style={styles.iconButton}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach a photo or file"
              onPress={attach}
              style={styles.iconButton}>
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
            </Pressable>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Message"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Message"
              multiline
              maxLength={MAX_LENGTH}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={submit}
              style={[styles.iconButton, styles.sendButton, !canSend && styles.disabled]}>
              <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        </SafeAreaView>
      )}

      <ImageViewer uri={photo?.uri ?? null} title={photo?.name} onClose={() => setPhoto(null)} />
    </KeyboardAvoidingView>
  );
}
