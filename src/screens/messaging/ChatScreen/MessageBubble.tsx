import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useAttachmentUrl, type ChatMessage } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { clockTime } from '@/lib/time';

import { createStyles, PHOTO_WIDTH } from './MessageBubble.styles';

type Props = {
  message: ChatMessage;
  mine: boolean;
  /** First / last of a run of messages from the same sender (corner shapes, time). */
  first: boolean;
  last: boolean;
  onRetry: () => void;
  onOpenPhoto: (uri: string, name: string | null) => void;
  onOpenFile: (path: string) => void;
};

const MIN_ASPECT = 0.6;
const MAX_ASPECT = 1.8;

function fileKind(mime: string | null): string {
  if (mime === 'application/pdf') return 'PDF';
  if (mime?.includes('word')) return 'Word document';
  return 'File';
}

/** Inline photo, sized to its real shape (within limits) like a messenger app. */
function PhotoAttachment({
  message,
  mine,
  onOpen,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpen: (uri: string) => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [aspect, setAspect] = useState(4 / 3);
  // The sender's own copy shows instantly; fall back to the server if it is gone.
  const [localFailed, setLocalFailed] = useState(false);
  const showLocal = Boolean(message.localUri) && !localFailed;
  // Recipients only get the file once it passed the security check.
  const viewable = mine || message.scan_status === 'clean';
  const remote = useAttachmentUrl(
    message.attachment_path,
    !showLocal && viewable && !message.delivery,
  );
  const uri = showLocal ? message.localUri! : remote.data;

  if (message.scan_status === 'blocked') {
    return (
      <View style={[styles.photo, styles.photoNotice, { width: PHOTO_WIDTH }]}>
        <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
        <Text style={[styles.noticeText, styles.blocked]}>Blocked by the security check</Text>
      </View>
    );
  }
  if (!viewable) {
    return (
      <View style={[styles.photo, styles.photoNotice, { width: PHOTO_WIDTH }]}>
        <ActivityIndicator color={colors.textMuted} />
        <Text style={styles.noticeText}>Checking photo…</Text>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={`Photo ${message.attachment_name ?? ''}. Tap to view`}
      disabled={!uri}
      onPress={() => uri && onOpen(uri)}
      style={[styles.photo, { width: PHOTO_WIDTH, height: PHOTO_WIDTH / aspect }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={styles.photoImage}
          contentFit="cover"
          transition={120}
          onLoad={(e) => {
            const { width, height } = e.source;
            if (width && height) {
              setAspect(Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, width / height)));
            }
          }}
          onError={() => showLocal && setLocalFailed(true)}
        />
      ) : (
        <ActivityIndicator color={colors.textMuted} />
      )}
      {message.delivery === 'sending' ? (
        <View style={styles.photoOverlay}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

/** PDF / Word attachment: a fixed-width card so long names never warp the bubble. */
function FileAttachment({
  message,
  mine,
  onOpen,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpen: (path: string) => void;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const blocked = message.scan_status === 'blocked';
  const viewable = !message.delivery && (mine || message.scan_status === 'clean');
  const status = message.delivery
    ? 'Uploading…'
    : blocked
      ? 'Blocked by the security check'
      : viewable
        ? 'Tap to open'
        : 'Being checked';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fileKind(message.attachment_mime)} ${message.attachment_name}. ${status}`}
      disabled={!viewable || !message.attachment_path}
      onPress={() => message.attachment_path && onOpen(message.attachment_path)}
      style={({ pressed }) => [
        styles.file,
        mine && styles.fileMine,
        pressed && styles.filePressed,
      ]}>
      <View style={[styles.fileIcon, blocked && styles.fileIconBlocked]}>
        <Ionicons
          name={blocked ? 'alert-circle-outline' : 'document-text-outline'}
          size={22}
          color={blocked ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.fileText}>
        <Text style={styles.fileName} numberOfLines={2}>
          {message.attachment_name}
        </Text>
        <Text style={[styles.fileMeta, blocked && styles.blocked]} numberOfLines={1}>
          {fileKind(message.attachment_mime)} · {status}
        </Text>
      </View>
    </Pressable>
  );
}

/** One message: text, photo or file, grouped with neighbours from the same sender. */
export function MessageBubble({
  message,
  mine,
  first,
  last,
  onRetry,
  onOpenPhoto,
  onOpenFile,
}: Props) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const failed = message.delivery === 'failed';
  const isPhoto = Boolean(message.attachment_mime?.startsWith('image/'));
  const hasFile = Boolean(message.attachment_name);
  const hasText = Boolean(message.body);

  const status = failed
    ? 'Not sent · Tap to retry'
    : message.delivery === 'sending'
      ? 'Sending…'
      : last
        ? `${clockTime(message.created_at)}${mine && message.read_at ? ' · Seen' : ''}`
        : null;

  const shape = [
    styles.bubble,
    mine ? styles.mine : styles.theirs,
    mine && !first && styles.mineJoinTop,
    mine && !last && styles.mineJoinBottom,
    !mine && !first && styles.theirsJoinTop,
    !mine && !last && styles.theirsJoinBottom,
  ];

  return (
    <View style={[styles.row, mine && styles.rowMine, last && styles.rowLast]}>
      <View style={[styles.column, mine && styles.columnMine, failed && styles.failed]}>
        {isPhoto && !hasText ? (
          // A photo on its own needs no bubble around it.
          <PhotoAttachment
            message={message}
            mine={mine}
            onOpen={(uri) => onOpenPhoto(uri, message.attachment_name)}
          />
        ) : (
          <View style={[shape, (isPhoto || hasFile) && styles.bubbleWithAttachment]}>
            {isPhoto ? (
              <PhotoAttachment
                message={message}
                mine={mine}
                onOpen={(uri) => onOpenPhoto(uri, message.attachment_name)}
              />
            ) : hasFile ? (
              <FileAttachment message={message} mine={mine} onOpen={onOpenFile} />
            ) : null}
            {hasText ? (
              <Text
                style={[
                  styles.body,
                  mine && styles.bodyMine,
                  (isPhoto || hasFile) && styles.caption,
                ]}
                selectable>
                {message.body}
              </Text>
            ) : null}
          </View>
        )}
        {status ? (
          <Pressable
            accessibilityRole={failed ? 'button' : 'text'}
            disabled={!failed}
            onPress={onRetry}
            hitSlop={8}>
            <Text style={[styles.status, mine && styles.statusMine, failed && styles.error]}>
              {status}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
