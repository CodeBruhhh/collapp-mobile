import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ReactionPicker } from '@/components/ReactionPicker';
import { useSetReaction } from '@/features/feed/hooks';
import {
  plural,
  rankedReactions,
  REACTIONS,
  reactionInfo,
  totalReactions,
  type Engagement,
  type Reaction,
} from '@/features/feed/reactions';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ReactionBar.styles';

const HOLD_MS = 300;

type ReactionBarProps = {
  postId: string;
  engagement: Engagement;
  onComment: () => void;
};

/** Reaction and comment totals, then Like (hold for more) and Comment. */
export function ReactionBar({ postId, engagement, onComment }: ReactionBarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const online = useIsOnline();
  const setReaction = useSetReaction();
  const likeButton = useRef<View>(null);
  const [anchorY, setAnchorY] = useState<number | null>(null);

  const total = totalReactions(engagement);
  const mine = engagement.mine ? reactionInfo(engagement.mine) : null;

  function choose(reaction: Reaction | null) {
    setAnchorY(null);
    setReaction.mutate({ postId, reaction });
  }

  function openPicker() {
    likeButton.current?.measureInWindow((_x, y) => setAnchorY(y));
  }

  return (
    <View style={styles.root}>
      {total > 0 || engagement.commentCount > 0 ? (
        <View style={styles.summary}>
          {total > 0 ? (
            <View
              style={styles.reactions}
              accessible
              accessibilityLabel={plural(total, 'reaction')}>
              {rankedReactions(engagement)
                .slice(0, 3)
                .map((r) => (
                  <Icon key={r.key} name={r.icon} size={16} color={colors.primary} />
                ))}
              <Text style={styles.summaryText}>{total}</Text>
            </View>
          ) : (
            <View style={styles.reactions} />
          )}
          {engagement.commentCount > 0 ? (
            <Text style={styles.summaryText}>{plural(engagement.commentCount, 'comment')}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={[styles.actions, !online && styles.disabled]}>
        <Pressable
          ref={likeButton}
          accessibilityRole="button"
          accessibilityLabel={mine ? `Your reaction: ${mine.label}` : 'Like'}
          accessibilityHint="Press and hold for more reactions"
          accessibilityState={{ selected: Boolean(mine), disabled: !online }}
          accessibilityActions={REACTIONS.map((r) => ({ name: r.key, label: r.label }))}
          onAccessibilityAction={(e) => choose(e.nativeEvent.actionName as Reaction)}
          disabled={!online}
          delayLongPress={HOLD_MS}
          onPress={() => choose(engagement.mine ? null : 'like')}
          onLongPress={openPicker}
          style={styles.action}>
          <Icon
            name={mine?.icon ?? 'reaction-like'}
            size={18}
            color={mine ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.actionText, mine && styles.actionTextActive]}>
            {mine?.label ?? 'Like'}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onComment} style={styles.action}>
          <Icon name="chatbubble-ellipses" size={18} color={colors.textMuted} />
          <Text style={styles.actionText}>Comment</Text>
        </Pressable>
      </View>
      <ReactionPicker
        anchorY={anchorY}
        selected={engagement.mine}
        onSelect={(reaction) => choose(reaction === engagement.mine ? null : reaction)}
        onClose={() => setAnchorY(null)}
      />
    </View>
  );
}
