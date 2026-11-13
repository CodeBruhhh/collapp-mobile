import { supabase } from '@/lib/supabase';

import type { Engagement, Reaction } from './reactions';

const POST_FIELDS = '*, college:colleges(id, name, logo_path)';

/** Latest published campus posts (RLS hides drafts and unpublished colleges). */
export async function listPublishedPosts(limit = 60) {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
export type FeedPost = Awaited<ReturnType<typeof listPublishedPosts>>[number];

/** One page of posts from the given colleges, newest first. */
export async function listFollowingPosts(collegeIds: string[], page: number, pageSize: number) {
  const from = page * pageSize;
  const { data, error } = await supabase
    .from('posts')
    .select(POST_FIELDS)
    .eq('status', 'published')
    .in('college_id', collegeIds)
    .order('published_at', { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;
  return data;
}

export async function getPost(id: string) {
  const { data, error } = await supabase.from('posts').select(POST_FIELDS).eq('id', id).single();
  if (error) throw error;
  return data;
}

/** Reaction totals, comment count and the caller's reaction, keyed by post id. */
export async function getEngagement(postIds: string[]): Promise<Record<string, Engagement>> {
  const { data, error } = await supabase.rpc('post_engagement', { p_post_ids: postIds });
  if (error) throw error;
  return Object.fromEntries(
    data.map((row) => [
      row.post_id,
      {
        counts: row.counts as Engagement['counts'],
        commentCount: row.comment_count,
        mine: row.my_reaction,
      },
    ]),
  );
}

/** Set, change or (with null) remove the student's reaction to a post. */
export async function setReaction(userId: string, postId: string, reaction: Reaction | null) {
  const { error } = reaction
    ? await supabase
        .from('post_reactions')
        .upsert({ post_id: postId, student_id: userId, reaction })
    : await supabase.from('post_reactions').delete().eq('post_id', postId).eq('student_id', userId);
  if (error) throw error;
}

export async function listComments(postId: string) {
  const { data, error } = await supabase.rpc('post_comments_list', { p_post_id: postId });
  if (error) throw error;
  return data;
}
export type PostComment = Awaited<ReturnType<typeof listComments>>[number];

export async function addComment(postId: string, body: string) {
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, body });
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from('post_comments').delete().eq('id', id);
  if (error) throw error;
}

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
