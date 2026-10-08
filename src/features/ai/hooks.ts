import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';

import { listRecommendations, refreshRecommendations, scoreApplication } from './api';

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
const lastAutoRefresh = new Map<string, number>();

export const aiKeys = {
  recommendations: (userId: string) => ['ai', 'recommendations', userId] as const,
};

export function useRefreshRecommendations() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshRecommendations,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: aiKeys.recommendations(userId) }),
  });
}

/**
 * The student's ranked matches. Generated automatically the first time and
 * refreshed when older than a week; students can also refresh manually.
 */
export function useRecommendations() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const query = useQuery({
    queryKey: aiKeys.recommendations(userId),
    queryFn: () => listRecommendations(userId),
    enabled: Boolean(userId),
  });
  const refresh = useRefreshRecommendations();

  const { data, isSuccess } = query;
  const { mutate, isPending, isError } = refresh;

  useEffect(() => {
    if (!isSuccess || isPending || isError) return;
    const generatedAt = data[0]?.generated_at;
    const stale =
      data.length === 0 ||
      (generatedAt !== undefined && Date.now() - Date.parse(generatedAt) > STALE_AFTER_MS);
    // Several screens use this hook; auto-refresh at most once per window per user.
    const last = lastAutoRefresh.get(userId) ?? 0;
    if (stale && Date.now() - last > AUTO_REFRESH_COOLDOWN_MS) {
      lastAutoRefresh.set(userId, Date.now());
      mutate();
    }
  }, [data, isSuccess, isPending, isError, mutate, userId]);

  return { ...query, refresh };
}

export function useScoreApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scoreApplication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rep'] }),
  });
}
