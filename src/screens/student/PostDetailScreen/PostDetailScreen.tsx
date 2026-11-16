import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollegeLogo } from '@/components/CollegeLogo';
import { CommentRow } from '@/components/CommentRow';
import { FollowButton } from '@/components/FollowButton';
import { Icon } from '@/components/Icon';
import { ImageViewer } from '@/components/ImageViewer';
import { ReactionBar } from '@/components/ReactionBar';
import { ReportSheet } from '@/components/ReportSheet';
import { ErrorState, LoadingState } from '@/components/StateView';
import {
  useAddComment,
  useComments,
  useDeleteComment,
  useEngagement,
  usePost,
} from '@/features/feed/hooks';
import { NO_ENGAGEMENT } from '@/features/feed/reactions';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';
import { ask, notify } from '@/lib/feedback';
import { publicUrl } from '@/lib/storage';
import { timeAgo } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './PostDetailScreen.styles';

const MAX_COMMENT = 1000;

type PostDetailScreenProps = {
  id: string;
  /** Open with the comment box focused (the feed's Comment button). */
  focusComment?: boolean;
};

/** The whole post with its reactions and comments. */
export function PostDetailScreen({ id, focusComment }: PostDetailScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const headerHeight = useHeaderHeight();
  const online = useIsOnline();

  const post = usePost(id);
  const comments = useComments(id);
  const engagement = useEngagement([id]);
  const addComment = useAddComment(id);
  const deleteComment = useDeleteComment(id);

  const input = useRef<TextInput>(null);
  const [body, setBody] = useState('');
  const [viewing, setViewing] = useState(false);
  const [reporting, setReporting] = useState<{ postId: string; commentId: string | null } | null>(
    null,
  );
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    // iOS reports the keyboard before it animates in; Android only after.
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subs = [
      Keyboard.addListener(show, () => setKeyboardOpen(true)),
      Keyboard.addListener(hide, () => setKeyboardOpen(false)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  if (post.isPending) return <LoadingState variant="detail" />;
  if (post.isError) return <ErrorState error={post.error} onRetry={post.refetch} />;

  const p = post.data;
  const image = publicUrl('college-media', p.media_path);
  const canSend = online && Boolean(body.trim()) && !addComment.isPending;

  async function submit() {
    if (!canSend) return;
    try {
      await addComment.mutateAsync(body.trim());
      setBody('');
      Keyboard.dismiss();
    } catch (e) {
      notify.error('Could not post your comment', getErrorMessage(e));
    }
  }

  function confirmDelete(commentId: string) {
    ask('Delete this comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment.mutateAsync(commentId);
          } catch (e) {
            notify.error('Could not delete', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}>
      <Stack.Screen options={{ title: 'Post' }} />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.list}
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListHeaderComponent={
          <View style={styles.post}>
            <View style={styles.header}>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Open ${p.college?.name}`}
                onPress={() =>
                  p.college &&
                  router.push({ pathname: '/student/college/[id]', params: { id: p.college.id } })
                }
                style={styles.college}>
                <CollegeLogo
                  name={p.college?.name ?? ''}
                  logoPath={p.college?.logo_path}
                  size={40}
                />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.college?.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    <Text style={styles.eyebrow}>{POST_TYPE_LABELS[p.type]}</Text>
                    {` · ${timeAgo(p.published_at ?? p.created_at)}`}
                  </Text>
                </View>
              </Pressable>
              <FollowButton collegeId={p.college_id} collegeName={p.college?.name} />
            </View>
            <Text accessibilityRole="header" style={styles.title}>
              {p.title}
            </Text>
            {p.event_at ? (
              <Text style={styles.date}>
                {p.type === 'deadline' ? 'Deadline' : 'Date'}:{' '}
                {new Date(p.event_at).toLocaleDateString()}
              </Text>
            ) : null}
            {image ? (
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel={`View image for ${p.title}`}
                onPress={() => setViewing(true)}>
                <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
              </Pressable>
            ) : null}
            {p.body ? <Text style={styles.body}>{p.body}</Text> : null}
            <ReactionBar
              postId={p.id}
              engagement={engagement.data?.[p.id] ?? NO_ENGAGEMENT}
              onComment={() => input.current?.focus()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Report this post"
              hitSlop={8}
              disabled={!online}
              onPress={() => setReporting({ postId: p.id, commentId: null })}
              style={styles.report}>
              <Text style={styles.reportText}>Report post</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.heading}>
              Comments
            </Text>
          </View>
        }
        ListEmptyComponent={
          comments.isPending ? (
            <View style={styles.status}>
              <LoadingState variant="inline" rows={2} />
            </View>
          ) : comments.isError ? (
            <ErrorState error={comments.error} onRetry={comments.refetch} />
          ) : (
            <Text style={styles.status}>No comments yet. Be the first to ask.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <CommentRow
              comment={item}
              onDelete={item.is_mine ? () => confirmDelete(item.id) : undefined}
              onReport={
                !item.is_mine && online
                  ? () => setReporting({ postId: p.id, commentId: item.id })
                  : undefined
              }
            />
          </View>
        )}
      />

      <SafeAreaView edges={keyboardOpen ? [] : ['bottom']} style={styles.footer}>
        {!online ? (
          <Text style={styles.notice}>You&apos;re offline. Reconnect to comment.</Text>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            ref={input}
            value={body}
            onChangeText={setBody}
            autoFocus={focusComment}
            placeholder="Write a comment"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Write a comment"
            multiline
            maxLength={MAX_COMMENT}
            style={styles.input}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send comment"
            accessibilityState={{ disabled: !canSend, busy: addComment.isPending }}
            disabled={!canSend}
            onPress={submit}
            style={[styles.send, !canSend && styles.sendDisabled]}>
            <Icon name="arrow-up" size={20} color={colors.onPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ImageViewer uri={viewing ? image : null} title={p.title} onClose={() => setViewing(false)} />
      <ReportSheet target={reporting} onClose={() => setReporting(null)} />
    </KeyboardAvoidingView>
  );
}
