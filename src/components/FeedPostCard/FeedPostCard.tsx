import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { FeedPost, PostType } from '@/types/models';
import { timeAgo } from '@/utils/dates';

import { createStyles } from './FeedPostCard.styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

const POST_TYPE: Record<PostType, { label: string; icon: IconName }> = {
  news: { label: 'News', icon: 'newspaper-outline' },
  event: { label: 'Event', icon: 'calendar-outline' },
  scholarship: { label: 'Scholarship', icon: 'ribbon-outline' },
  deadline: { label: 'Deadline', icon: 'alarm-outline' },
};

export function FeedPostCard({ post }: { post: FeedPost }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const type = POST_TYPE[post.type];

  return (
    <View style={styles.card}>
      <View style={styles.typeRow}>
        <Ionicons name={type.icon} size={16} color={colors.primary} />
        <Text style={styles.type}>{type.label}</Text>
      </View>
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.body} numberOfLines={3}>
        {post.body}
      </Text>
      <Text style={styles.meta}>
        {post.collegeName} {'\u00B7'} {timeAgo(post.postedAt)}
      </Text>
    </View>
  );
}
