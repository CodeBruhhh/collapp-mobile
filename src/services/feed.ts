import { FEED_POSTS } from '@/data/mockData';
import type { FeedPost } from '@/types/models';

import { delay } from './mockApi';

/** Newest first. Later: posts from followed / matched institutions only. */
export function listFeedPosts(): Promise<FeedPost[]> {
  return delay([...FEED_POSTS].sort((a, b) => b.postedAt.localeCompare(a.postedAt)));
}
