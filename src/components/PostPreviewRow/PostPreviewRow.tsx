import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CollegeLogo } from '@/components/CollegeLogo';
import type { FeedPost } from '@/features/feed/api';
import { NO_ENGAGEMENT, plural, totalReactions, type Engagement } from '@/features/feed/reactions';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { useTheme } from '@/hooks/useTheme';
import { timeAgo } from '@/lib/time';

import { createStyles } from './PostPreviewRow.styles';

type PostPreviewRowProps = {
  post: FeedPost;
  engagement?: Engagement;
  /** The list's first row also rules its top edge. */
  first?: boolean;
};

/** A text-only line for Home's Campus updates; tapping it opens the post. */
export function PostPreviewRow({ post, engagement = NO_ENGAGEMENT, first }: PostPreviewRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const reactions = totalReactions(engagement);
  const counts = [
    reactions > 0 ? plural(reactions, 'reaction') : null,
    engagement.commentCount > 0 ? plural(engagement.commentCount, 'comment') : null,
  ].filter(Boolean);

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: '/student/post/[id]', params: { id: post.id } })}
      style={({ pressed }) => [styles.row, first && styles.first, pressed && styles.pressed]}>
      <CollegeLogo name={post.college?.name ?? ''} logoPath={post.college?.logo_path} size={40} />
      <View style={styles.text}>
        <Text style={styles.meta} numberOfLines={1}>
          <Text style={styles.eyebrow}>{POST_TYPE_LABELS[post.type]}</Text>
          {` · ${post.college?.name} · ${timeAgo(post.published_at ?? post.created_at)}`}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        {counts.length ? <Text style={styles.meta}>{counts.join(' · ')}</Text> : null}
      </View>
    </Pressable>
  );
}
