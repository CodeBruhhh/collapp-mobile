import { useQuery } from '@tanstack/react-query';

import { useRecommendations } from '@/features/ai/hooks';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { useFollowedColleges } from '@/features/colleges/hooks';

import { listPublishedPosts, rankFeed } from './api';

/** The student's ranked campus feed (SRS 3.1.1, 3.1.2.3). */
export function useFeed() {
  const posts = useQuery({ queryKey: ['feed', 'posts'], queryFn: () => listPublishedPosts() });
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
