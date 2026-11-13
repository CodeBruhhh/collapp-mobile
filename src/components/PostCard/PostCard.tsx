import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CollegeLogo } from '@/components/CollegeLogo';
import { FollowButton } from '@/components/FollowButton';
import { ReactionBar } from '@/components/ReactionBar';
import type { FeedPost } from '@/features/feed/api';
import { NO_ENGAGEMENT, type Engagement } from '@/features/feed/reactions';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { useTheme } from '@/hooks/useTheme';
import { publicUrl } from '@/lib/storage';
import { timeAgo } from '@/lib/time';

import { createStyles } from './PostCard.styles';

const LONG_BODY = 180;

type PostCardProps = {
  post: FeedPost;
  engagement?: Engagement;
  /** Show Follow beside the college; pointless in a feed of followed colleges. */
  showFollow?: boolean;
};

const openPost = (id: string, focusComment?: boolean) =>
  router.push({
    pathname: '/student/post/[id]',
    params: { id, ...(focusComment ? { comment: '1' } : {}) },
  });

/** One campus post in the feed (SDD screen 6 / SRS 3.1.2.3). */
export function PostCard({ post, engagement = NO_ENGAGEMENT, showFollow }: PostCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const image = publicUrl('college-media', post.media_path);

  return (
    <View style={styles.post}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Open ${post.college?.name}`}
          onPress={() =>
            post.college &&
            router.push({ pathname: '/student/college/[id]', params: { id: post.college.id } })
          }
          style={styles.college}>
          <CollegeLogo
            name={post.college?.name ?? ''}
            logoPath={post.college?.logo_path}
            size={40}
          />
          <View style={styles.flex}>
            <Text style={styles.name} numberOfLines={1}>
              {post.college?.name}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              <Text style={styles.eyebrow}>{POST_TYPE_LABELS[post.type]}</Text>
              {` · ${timeAgo(post.published_at ?? post.created_at)}`}
            </Text>
          </View>
        </Pressable>
        {showFollow ? (
          <FollowButton collegeId={post.college_id} collegeName={post.college?.name} />
        ) : null}
      </View>
      <Pressable accessibilityRole="link" onPress={() => openPost(post.id)} style={styles.opener}>
        <Text style={styles.title}>{post.title}</Text>
        {post.event_at ? (
          <Text style={styles.date}>
            {post.type === 'deadline' ? 'Deadline' : 'Date'}:{' '}
            {new Date(post.event_at).toLocaleDateString()}
          </Text>
        ) : null}
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={`Image for ${post.title}`}
          />
        ) : null}
        {post.body ? (
          <Text style={styles.body} numberOfLines={4}>
            {post.body}
          </Text>
        ) : null}
        {post.body.length > LONG_BODY ? <Text style={styles.more}>Read more</Text> : null}
      </Pressable>
      <ReactionBar
        postId={post.id}
        engagement={engagement}
        onComment={() => openPost(post.id, true)}
      />
    </View>
  );
}
