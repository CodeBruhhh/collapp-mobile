import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useAttachmentUrl, type ChatMessage } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { fixedColors } from '@/styles';
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
const DEFAULT_ASPECT = 4 / 3;

/**
 * Photo shapes measured this session, by message id. The list unmounts bubbles
 * that scroll far away; a returning bubble starts at its real size instead of
 * opening at 4:3 and jumping.
 */
const knownAspects = new Map<string, number>();

function aspectOf(width: number | undefined, height: number | undefined): number {
  if (!width || !height) return DEFAULT_ASPECT;
  // Rounded so tiny measuring differences can never change the size again.
  return Math.round(Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, width / height)) * 100) / 100;
}

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
  // Unknown until the first load; the photo stays hidden until then so it is
  // never drawn stretched into a placeholder box.
  const [aspect, setAspect] = useState(() => knownAspects.get(message.id));
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
  // Signed links change every few minutes. Caching by storage path means a new
  // link reuses the downloaded photo instead of fetching and redrawing it.
  const source = uri
    ? showLocal || !message.attachment_path
      ? { uri }
      : { uri, cacheKey: `attachment:${message.attachment_path}` }
    : null;

  if (message.scan_status === 'blocked') {
    return (
      <View style={[styles.photo, styles.photoNotice, { width: PHOTO_WIDTH }]}>
        <Icon name="alert-circle" size={24} color={colors.danger} />
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
      style={[
        styles.photo,
        { width: PHOTO_WIDTH, height: PHOTO_WIDTH / (aspect ?? DEFAULT_ASPECT) },
      ]}>
      {!source || aspect === undefined ? <ActivityIndicator color={colors.textMuted} /> : null}
      {source ? (
        <Image
          source={source}
          style={[styles.photoImage, aspect === undefined && styles.photoHidden]}
          contentFit="cover"
          cachePolicy="memory-disk"
          onLoad={(e) => {
            // Measure once. Android reloads the photo for each new box size and can
            // report slightly different dimensions each time; re-measuring then
            // resized the box again, an endless flicker-and-reload loop.
            const next = knownAspects.get(message.id) ?? aspectOf(e.source.width, e.source.height);
            knownAspects.set(message.id, next);
            setAspect(next);
          }}
          onError={() => {
            if (showLocal) setLocalFailed(true);
            else setAspect((a) => a ?? DEFAULT_ASPECT);
          }}
        />
      ) : null}
      {message.delivery === 'sending' ? (
        <View style={styles.photoOverlay}>
          <ActivityIndicator color={fixedColors.white} />
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
        <Icon
          name={blocked ? 'alert-circle' : 'document-text'}
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
