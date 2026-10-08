import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import type { FeedPost } from '@/features/feed/api';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { useTheme } from '@/hooks/useTheme';
import { publicUrl } from '@/lib/storage';

import { createStyles } from './PostCard.styles';

/** One campus post in the student feed (SDD screen 6 / SRS 3.1.2.3). */
export function PostCard({ post }: { post: FeedPost }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const image = publicUrl('college-media', post.media_path);
  const long = post.body.length > 180;

  return (
    <Card>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open ${post.college?.name}`}
        onPress={() =>
          post.college &&
          router.push({ pathname: '/student/college/[id]', params: { id: post.college.id } })
        }
        style={styles.header}>
        <CollegeLogo name={post.college?.name ?? ''} logoPath={post.college?.logo_path} size={32} />
        <View style={styles.flex}>
          <Text style={styles.college} numberOfLines={1}>
            {post.college?.name}
          </Text>
          <Text style={styles.meta}>
            {POST_TYPE_LABELS[post.type]} ·{' '}
            {new Date(post.published_at ?? post.created_at).toLocaleDateString()}
          </Text>
        </View>
      </Pressable>
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
      <Text style={styles.body} numberOfLines={expanded ? undefined : 4}>
        {post.body}
      </Text>
      {long ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)}>
          <Text style={styles.more}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
