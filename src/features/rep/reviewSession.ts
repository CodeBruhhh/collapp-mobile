import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { useReviewQueue } from './hooks';
import { DEFAULT_QUEUE_FILTERS, type QueueFilters } from './queue';

/**
 * Working through the queue: the filters it was opened with, where in the list
 * the rep is, and who they've already seen (so "next" never loops back).
 */
type ReviewSession = {
  filters: QueueFilters;
  /** The applicant the session is on; any other screen (a notification) has no "next". */
  current: string;
  position: number;
  seen: Set<string>;
};

let session: ReviewSession | null = null;

/** Called when a rep opens an applicant from the queue. */
export function startReviewSession(filters: QueueFilters, position: number, id: string) {
  session = { filters, current: id, position, seen: new Set([id]) };
}

/**
 * The applicant after `currentId` in the queue the rep came from. When the
 * current one has left the list (a decision moved it out of the filter), the
 * next is whoever now holds its old place. Loads more pages as needed.
 */
export function useNextApplicant(currentId: string) {
  // Fixed for this screen; moving on starts a new screen with the updated session.
  const [active] = useState(() => (session?.current === currentId ? session : null));
  const queue = useReviewQueue(active?.filters ?? DEFAULT_QUEUE_FILTERS, {
    enabled: active !== null,
  });
  const rows = queue.data?.pages.flatMap((p) => p.rows) ?? [];
  const at = rows.findIndex((r) => r.id === currentId);
  const from = at >= 0 ? at + 1 : (active?.position ?? 0);
  const nextIndex = active
    ? rows.findIndex((r, i) => i >= from && r.id !== currentId && !active.seen.has(r.id))
    : -1;
  const next = nextIndex >= 0 ? rows[nextIndex] : null;

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = queue;
  useEffect(() => {
    if (active && !next && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [active, next, hasNextPage, isFetchingNextPage, fetchNextPage]);

  function goNext(): boolean {
    if (!active || !next) return false;
    session = {
      filters: active.filters,
      current: next.id,
      position: nextIndex,
      seen: new Set([...active.seen, currentId]),
    };
    router.replace({ pathname: '/rep/applicant/[id]', params: { id: next.id } });
    return true;
  }

  return {
    active: active !== null,
    next,
    /** 1-based place in the list, when the current applicant is still in it. */
    position: at >= 0 ? at + 1 : null,
    total: queue.data?.pages[0]?.total ?? null,
    loading: queue.isFetching && !next,
    goNext,
  };
}
