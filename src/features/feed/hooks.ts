import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { useRecommendations } from '@/features/ai/hooks';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { useFollowedColleges } from '@/features/colleges/hooks';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import {
  addComment,
  deleteComment,
  getEngagement,
  getPost,
  listComments,
  listFollowingPosts,
  listPublishedPosts,
  rankFeed,
  setReaction,
} from './api';
import { withReaction, type Engagement, type Reaction } from './reactions';

const PAGE_SIZE = 20;

const feedKeys = {
  posts: ['feed', 'posts'] as const,
  post: (id: string) => ['feed', 'post', id] as const,
  following: (collegeIds: string[]) => ['feed', 'following', ...collegeIds] as const,
  engagement: ['feed', 'engagement'] as const,
  engagementFor: (postIds: string[]) => ['feed', 'engagement', ...postIds] as const,
  comments: (postId: string) => ['feed', 'comments', postId] as const,
};

/** The student's ranked campus feed (SRS 3.1.1, 3.1.2.3). */
export function useFeed() {
  const posts = useQuery({ queryKey: feedKeys.posts, queryFn: () => listPublishedPosts() });
  const followed = useFollowedColleges();
  const applications = useApplicationsWithLocal();
  const recommendations = useRecommendations();

  const matched = new Map<string, number>();
  for (const r of recommendations.data ?? []) {
    if (r.college)
      matched.set(r.college.id, Math.max(matched.get(r.college.id) ?? 0, r.match_score));
  }
  const ranked = posts.data
    ? rankFeed(posts.data, {
        followed: new Set(followed.data ?? []),
        applied: new Set((applications.data ?? []).map((a) => a.college_id)),
        matched,
      })
    : undefined;

  return { ...posts, data: ranked };
}

/** Newest posts from the colleges the student follows, one page at a time. */
export function useFollowingFeed() {
  const followed = useFollowedColleges();
  const collegeIds = [...(followed.data ?? [])].sort();
  const posts = useInfiniteQuery({
    queryKey: feedKeys.following(collegeIds),
    queryFn: ({ pageParam }) => listFollowingPosts(collegeIds, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length === PAGE_SIZE ? lastPageParam + 1 : undefined,
    enabled: collegeIds.length > 0,
  });
  return { ...posts, followed, data: posts.data?.pages.flat() };
}

export function usePost(id: string) {
  return useQuery({ queryKey: feedKeys.post(id), queryFn: () => getPost(id) });
}

/** Engagement for the given posts, keyed by post id. */
export function useEngagement(postIds: string[]) {
  return useQuery({
    queryKey: feedKeys.engagementFor(postIds),
    queryFn: () => getEngagement(postIds),
    enabled: postIds.length > 0,
  });
}

/** React to a post; every list showing it updates at once, and rolls back on failure. */
export function useSetReaction() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? '';

  return useMutation({
    mutationFn: ({ postId, reaction }: { postId: string; reaction: Reaction | null }) =>
      setReaction(userId, postId, reaction),
    onMutate: async ({ postId, reaction }) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.engagement });
      const previous = queryClient.getQueriesData<Record<string, Engagement>>({
        queryKey: feedKeys.engagement,
      });
      queryClient.setQueriesData<Record<string, Engagement>>(
        { queryKey: feedKeys.engagement },
        (map) => (map?.[postId] ? { ...map, [postId]: withReaction(map[postId], reaction) } : map),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      notify.error('Could not save your reaction', getErrorMessage(error));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKeys.engagement }),
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: feedKeys.comments(postId),
    queryFn: () => listComments(postId),
  });
}

function useRefreshComments(postId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: feedKeys.comments(postId) }),
      queryClient.invalidateQueries({ queryKey: feedKeys.engagement }),
    ]);
}

export function useAddComment(postId: string) {
  const refresh = useRefreshComments(postId);
  return useMutation({
    mutationFn: (body: string) => addComment(postId, body),
    onSuccess: refresh,
  });
}

export function useDeleteComment(postId: string) {
  const refresh = useRefreshComments(postId);
  return useMutation({ mutationFn: deleteComment, onSuccess: refresh });
}
