import { supabase } from '@/lib/supabase';

/** Latest published campus posts (RLS hides drafts and unpublished colleges). */
export async function listPublishedPosts(limit = 60) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, college:colleges(id, name, logo_path)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
export type FeedPost = Awaited<ReturnType<typeof listPublishedPosts>>[number];

type Affinity = {
  followed: Set<string>;
  applied: Set<string>;
  /** College id -> best AI match score (0-100). */
  matched: Map<string, number>;
};

const HALF_LIFE_DAYS = 7;

/**
 * Algorithmic feed (SRS 3.1.2.3): posts from colleges the student follows,
 * applied to or was matched with rank higher, and newer posts beat older ones.
 * score = recency decay × (1 + relevance); deadline/event posts in the next
 * two weeks get a small boost.
 */
export function rankFeed(posts: FeedPost[], affinity: Affinity, now = Date.now()) {
  return posts
    .map((post) => {
      const ageDays = (now - Date.parse(post.published_at ?? post.created_at)) / 86_400_000;
      const recency = Math.pow(0.5, Math.max(0, ageDays) / HALF_LIFE_DAYS);
      const relevance = Math.max(
        affinity.followed.has(post.college_id) ? 1 : 0,
        affinity.applied.has(post.college_id) ? 0.8 : 0,
        (affinity.matched.get(post.college_id) ?? 0) / 100,
      );
      const upcoming =
        post.event_at &&
        Date.parse(post.event_at) > now &&
        Date.parse(post.event_at) - now < 14 * 86_400_000
          ? 0.3
          : 0;
      return { post, rank: recency * (1 + relevance + upcoming) };
    })
    .sort((a, b) => b.rank - a.rank)
    .map((r) => r.post);
}
