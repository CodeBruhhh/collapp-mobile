import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { attachmentUrl } from '@/features/messaging/api';
import type { ChatMessage } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { clockTime } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ChatScreen.styles';

type Props = {
  message: ChatMessage;
  mine: boolean;
  onRetry: () => void;
};

function attachmentStatus(message: ChatMessage, mine: boolean): string {
  if (message.delivery === 'sending') return 'Uploading…';
  if (message.scan_status === 'pending') return mine ? 'Checking file…' : 'Being checked';
  if (message.scan_status === 'blocked') return 'Blocked by the security check';
  return 'Tap to open';
}

/** One chat bubble with optional attachment, delivery and read state. */
export function MessageBubble({ message, mine, onRetry }: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const failed = message.delivery === 'failed';
  const canOpen = !message.delivery && message.attachment_path && message.scan_status === 'clean';

  async function openAttachment() {
    if (!message.attachment_path) return;
    try {
      await Linking.openURL(await attachmentUrl(message.attachment_path));
    } catch (e) {
      Alert.alert('Could not open file', getErrorMessage(e));
    }
  }

  const status = failed
    ? 'Not sent · Tap to retry'
    : message.delivery === 'sending'
      ? 'Sending…'
      : `${clockTime(message.created_at)}${mine && message.read_at ? ' · Seen' : ''}`;

  return (
    <View style={[styles.bubbleRow, mine && styles.mineRow]}>
      <Pressable
        accessibilityRole={failed ? 'button' : undefined}
        accessibilityLabel={`${mine ? 'You' : 'They'}: ${message.body || message.attachment_name}. ${status}`}
        disabled={!failed}
        onPress={onRetry}
        style={[styles.bubble, mine ? styles.mine : styles.theirs, failed && styles.failed]}>
        {message.attachment_name ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Attachment ${message.attachment_name}, ${attachmentStatus(message, mine)}`}
            disabled={!canOpen}
            onPress={openAttachment}
            style={styles.attachment}>
            <Ionicons
              name={
                message.scan_status === 'blocked'
                  ? 'alert-circle-outline'
                  : message.attachment_mime?.startsWith('image/')
                    ? 'image-outline'
                    : 'document-outline'
              }
              size={22}
              color={message.scan_status === 'blocked' ? colors.danger : colors.text}
            />
            <View style={styles.attachmentText}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                {message.attachment_name}
              </Text>
              <Text
                style={[
                  styles.attachmentStatus,
                  message.scan_status === 'blocked' && styles.blocked,
                ]}>
                {attachmentStatus(message, mine)}
              </Text>
            </View>
          </Pressable>
        ) : null}
        {message.body ? (
          <Text style={[styles.body, mine && styles.bodyMine]} selectable>
            {message.body}
          </Text>
        ) : null}
        <Text style={failed ? styles.error : [styles.time, mine && styles.timeMine]}>{status}</Text>
      </Pressable>
    </View>
  );
}
