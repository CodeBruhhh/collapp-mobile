import type { IconName } from '@/components/Icon';
import type { Enums } from '@/types/database';

export type Reaction = Enums<'post_reaction'>;

/** Picker order. */
export const REACTIONS: { key: Reaction; label: string; icon: IconName }[] = [
  { key: 'like', label: 'Like', icon: 'reaction-like' },
  { key: 'love', label: 'Love', icon: 'reaction-love' },
  { key: 'care', label: 'Care', icon: 'reaction-care' },
  { key: 'haha', label: 'Haha', icon: 'reaction-haha' },
  { key: 'wow', label: 'Wow', icon: 'reaction-wow' },
  { key: 'sad', label: 'Sad', icon: 'reaction-sad' },
];

export type Engagement = {
  counts: Partial<Record<Reaction, number>>;
  commentCount: number;
  mine: Reaction | null;
};

export const NO_ENGAGEMENT: Engagement = { counts: {}, commentCount: 0, mine: null };

export const reactionInfo = (key: Reaction) => REACTIONS.find((r) => r.key === key)!;

/** Reactions with at least one vote, most popular first. */
export function rankedReactions(engagement: Engagement) {
  return REACTIONS.flatMap((r) => {
    const count = engagement.counts[r.key] ?? 0;
    return count > 0 ? [{ ...r, count }] : [];
  }).sort((a, b) => b.count - a.count);
}

export const totalReactions = (engagement: Engagement) =>
  rankedReactions(engagement).reduce((total, r) => total + r.count, 0);

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The same engagement after the student picks `next` (null removes theirs). */
export function withReaction(engagement: Engagement, next: Reaction | null): Engagement {
  const counts = { ...engagement.counts };
  if (engagement.mine) counts[engagement.mine] = Math.max(0, (counts[engagement.mine] ?? 0) - 1);
  if (next) counts[next] = (counts[next] ?? 0) + 1;
  return { ...engagement, counts, mine: next };
}
