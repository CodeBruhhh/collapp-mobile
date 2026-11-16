import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/Icon';
import type { PostComment } from '@/features/feed/api';
import { useTheme } from '@/hooks/useTheme';
import { timeAgo } from '@/lib/time';

import { createStyles } from './CommentRow.styles';

type CommentRowProps = {
  comment: PostComment;
  /** Removes the comment; `icon` shows a trash button instead of a Delete link. */
  onDelete?: () => void;
  icon?: boolean;
  /** Sends someone else's comment to the admins (students only). */
  onReport?: () => void;
};

/** One ruled comment, shared by the student's post view and the rep's insights. */
export function CommentRow({ comment, onDelete, icon, onReport }: CommentRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <Avatar name={comment.author_name} avatarPath={comment.author_avatar_path} size={32} />
      <View style={styles.text}>
        <Text style={styles.meta}>
          <Text style={styles.name}>{comment.author_name}</Text>
          {` · ${timeAgo(comment.created_at)}`}
        </Text>
        <Text style={styles.body}>{comment.body}</Text>
        {onDelete && !icon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete your comment"
            hitSlop={8}
            onPress={onDelete}
            style={styles.delete}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        ) : null}
        {onReport ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Report comment by ${comment.author_name}`}
            hitSlop={8}
            onPress={onReport}
            style={styles.delete}>
            <Text style={styles.deleteText}>Report</Text>
          </Pressable>
        ) : null}
      </View>
      {onDelete && icon ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete comment by ${comment.author_name}`}
          onPress={onDelete}
          style={styles.trash}>
          <Icon name="trash" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
