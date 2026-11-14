import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { CommentRow } from '@/components/CommentRow';
import { Icon } from '@/components/Icon';
import { ImageViewer } from '@/components/ImageViewer';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StickyActionBar } from '@/components/StickyActionBar';
import { useComments, useDeleteComment, useEngagement } from '@/features/feed/hooks';
import { NO_ENGAGEMENT, rankedReactions, totalReactions } from '@/features/feed/reactions';
import { usePosts } from '@/features/rep/hooks';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { useTheme } from '@/hooks/useTheme';
import { ask, notify } from '@/lib/feedback';
import { publicUrl } from '@/lib/storage';
import { timeAgo } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './PostInsightsScreen.styles';

/** How students responded to a published post; the rep can remove comments here. */
export function PostInsightsScreen({ id }: { id: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const posts = usePosts();
  const engagement = useEngagement([id]);
  const comments = useComments(id);
  const deleteComment = useDeleteComment(id);
  const [viewing, setViewing] = useState(false);

  if (posts.isPending) return <LoadingState variant="detail" />;
  if (posts.isError) return <ErrorState error={posts.error} onRetry={posts.refetch} />;
  const post = posts.data.find((p) => p.id === id);
  if (!post) return <ErrorState error={new Error('Post not found.')} />;

  const stats = engagement.data?.[id] ?? NO_ENGAGEMENT;
  const image = publicUrl('college-media', post.media_path);

  function confirmDelete(commentId: string, author: string) {
    ask('Delete this comment?', `Students will no longer see ${author}'s comment.`, [
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
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Post insights' }} />
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <View>
            <Text style={styles.meta}>
              <Text style={styles.eyebrow}>{POST_TYPE_LABELS[post.type]}</Text>
              {post.published_at ? ` · Published ${timeAgo(post.published_at)}` : ''}
            </Text>
            <Text accessibilityRole="header" style={styles.title}>
              {post.title}
            </Text>
            {image ? (
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel={`Image for ${post.title}. Tap to view`}
                onPress={() => setViewing(true)}
                style={styles.imageFrame}>
                <Image
                  source={{ uri: image }}
                  style={styles.image}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </Pressable>
            ) : null}
            <View style={styles.figures}>
              <View accessible>
                <Text style={styles.figure}>{totalReactions(stats)}</Text>
                <Text style={styles.label}>Reactions</Text>
              </View>
              <View accessible>
                <Text style={styles.figure}>{stats.commentCount}</Text>
                <Text style={styles.label}>Comments</Text>
              </View>
            </View>
            {totalReactions(stats) > 0 ? (
              <View style={styles.breakdown}>
                {rankedReactions(stats).map((r) => (
                  <View key={r.key} style={styles.reaction} accessible>
                    <Icon name={r.icon} size={18} color={colors.primary} />
                    <Text style={styles.reactionText}>
                      {r.label} {r.count}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text accessibilityRole="header" style={styles.heading}>
              Comments
            </Text>
          </View>
        }
        ListEmptyComponent={
          comments.isPending ? (
            <LoadingState variant="inline" rows={2} />
          ) : comments.isError ? (
            <ErrorState error={comments.error} onRetry={comments.refetch} />
          ) : (
            <Text style={styles.status}>No comments yet.</Text>
          )
        }
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            icon
            onDelete={() => confirmDelete(item.id, item.author_name)}
          />
        )}
      />
      <StickyActionBar>
        <View style={styles.root}>
          <Button
            variant="secondary"
            label="Edit post"
            onPress={() => router.push({ pathname: '/rep/post/[id]', params: { id } })}
          />
        </View>
      </StickyActionBar>
      <ImageViewer
        uri={viewing ? image : null}
        title={post.title}
        onClose={() => setViewing(false)}
      />
    </View>
  );
}
