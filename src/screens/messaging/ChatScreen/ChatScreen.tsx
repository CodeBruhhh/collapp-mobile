import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
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

import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { newMessageId, type ThreadDetail } from '@/features/messaging/api';
import {
  useMarkThreadRead,
  useMessages,
  useSendMessage,
  useThread,
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

type Draft = { body: string; attachment: LocalFile | null };

/** SDD screens 16 / 26 — a formal conversation with realtime delivery and read receipts. */
export function ChatScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { role, session } = useAuth();
  const userId = session?.user.id;
  const headerHeight = useHeaderHeight();
  const online = useIsOnline();

  const thread = useThread(id);
  const messages = useMessages(id);
  const send = useSendMessage(id);
  const markRead = useMarkThreadRead(id);

  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<LocalFile | null>(null);
  // Kept so a failed bubble can be re-sent with the same id (no duplicates).
  const [sent, setSent] = useState<Record<string, Draft>>({});

  // Admins may audit student<->rep conversations but never take part (SRS 3.6.5).
  const readOnly = role === 'admin' && thread.data?.kind === 'student_rep';
  const list = messages.data ?? [];
  const hasUnread =
    !readOnly && list.some((m) => m.sender_id !== userId && !m.read_at && !m.delivery);
  const { mutate: markAsRead, isPending: marking, isError: markFailed } = markRead;

  useEffect(() => {
    if (hasUnread && !marking && !markFailed) markAsRead();
  }, [hasUnread, marking, markFailed, markAsRead]);

  function deliver(messageId: string, draft: Draft) {
    send.mutate({ id: messageId, body: draft.body, attachment: draft.attachment });
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

  if (thread.isError) return <ErrorState error={thread.error} onRetry={thread.refetch} />;

  const canSend = online && Boolean(body.trim() || attachment);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}>
      <Stack.Screen options={{ title: chatTitle(role, thread.data) }} />
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        // Inverted: newest at the bottom, opening scrolled to the latest message.
        inverted={list.length > 0}
        data={[...list].reverse()}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          messages.isPending ? (
            <LoadingState />
          ) : messages.isError ? (
            <ErrorState error={messages.error} onRetry={messages.refetch} />
          ) : (
            <EmptyState
              icon="chatbubble-ellipses-outline"
              title="Start the conversation"
              body="Messages here are formal and visible to your college's representatives and the administrator."
            />
          )
        }
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            mine={item.sender_id === userId}
            onRetry={() => {
              const draft = sent[item.id];
              if (draft) deliver(item.id, draft);
            }}
          />
        )}
      />

      {readOnly ? (
        <SafeAreaView edges={['bottom']}>
          <Text style={[styles.notice, styles.readOnlyNotice]}>
            Audit view: administrators can read student conversations but not reply.
          </Text>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']}>
          {!online ? (
            <Text style={styles.notice}>You&apos;re offline. Reconnect to send messages.</Text>
          ) : null}
          {attachment ? (
            <View style={styles.pending}>
              <Ionicons name="attach" size={20} color={colors.text} />
              <Text style={styles.attachmentName} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Remove attachment"
                onPress={() => setAttachment(null)}
                style={styles.iconButton}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attach a file"
              onPress={attach}
              style={styles.iconButton}>
              <Ionicons name="attach" size={24} color={colors.text} />
            </Pressable>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Write a message"
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
              <Ionicons name="send" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </KeyboardAvoidingView>
  );
}
