import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';

import {
  fetchMyAiUsage,
  getEssayFeedback,
  getEssayReview,
  listDocumentChecks,
  listRecommendations,
  recheckDocument,
  refreshRecommendations,
  regenerateEssayReview,
  scoreApplication,
  type AiKind,
} from './api';

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
const lastAutoRefresh = new Map<string, number>();

export const aiKeys = {
  recommendations: (userId: string) => ['ai', 'recommendations', userId] as const,
  documentChecks: (applicationId: string) => ['ai', 'document-checks', applicationId] as const,
  essayReview: (applicationId: string) => ['ai', 'essay-review', applicationId] as const,
  usage: () => ['ai', 'usage'] as const,
};

/** The signed-in person's AI uses and limits for today (refreshed after each AI action). */
export function useMyAiUsage() {
  const { session } = useAuth();
  return useQuery({
    queryKey: aiKeys.usage(),
    queryFn: fetchMyAiUsage,
    enabled: Boolean(session),
    staleTime: 30_000,
  });
}

/**
 * One limit for the current person: how many are left, and whether it is used up.
 * `limit` null means unlimited (administrators) or not loaded yet.
 */
export function useAiAllowance(kind: AiKind) {
  const usage = useMyAiUsage();
  const item = usage.data?.items.find((i) => i.kind === kind);
  const limit = item?.limit ?? null;
  const used = item?.used ?? 0;
  const left = limit === null ? null : Math.max(0, limit - used);
  return {
    item,
    used,
    limit,
    left,
    exhausted: left === 0,
    paused: usage.data?.enabled === false,
    resetsAt: usage.data?.resets_at ?? null,
  };
}

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

/** Poll while the checker runs; it usually answers within a few seconds. */
const POLL_MS = 4000;
/** A fresh upload gets its check row once it reaches the server; wait this long for it. */
const NEW_UPLOAD_WINDOW_MS = 3 * 60 * 1000;

/**
 * AI checks for one application's documents, keyed by document id. Pass the
 * server documents so a just-uploaded file is polled until its check appears.
 */
export function useDocumentChecks(
  applicationId: string | null | undefined,
  documents: { id: string; updated_at: string }[] = [],
) {
  const query = useQuery({
    queryKey: aiKeys.documentChecks(applicationId ?? ''),
    queryFn: () => listDocumentChecks(applicationId!),
    enabled: Boolean(applicationId),
    refetchInterval: (q) => {
      const checks = q.state.data ?? [];
      if (checks.some((c) => c.status === 'pending')) return POLL_MS;
      const known = new Set(checks.map((c) => c.document_id));
      const waiting = documents.some(
        (d) => !known.has(d.id) && Date.now() - Date.parse(d.updated_at) < NEW_UPLOAD_WINDOW_MS,
      );
      return waiting ? POLL_MS : false;
    },
  });
  const byDocument = new Map((query.data ?? []).map((c) => [c.document_id, c]));
  /** Just uploaded, check not recorded yet. */
  const isAwaiting = (doc: { id: string; updated_at: string }) =>
    !byDocument.has(doc.id) && Date.now() - Date.parse(doc.updated_at) < NEW_UPLOAD_WINDOW_MS;
  return { ...query, byDocument, isAwaiting };
}

export function useRecheckDocument(applicationId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recheckDocument,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.documentChecks(applicationId ?? '') });
      queryClient.invalidateQueries({ queryKey: aiKeys.usage() });
    },
  });
}

export function useEssayFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (a: { essay: string; prompt: string | null }) =>
      getEssayFeedback(a.essay, a.prompt),
    onSettled: () => queryClient.invalidateQueries({ queryKey: aiKeys.usage() }),
  });
}

export function useEssayReview(applicationId: string | null | undefined) {
  return useQuery({
    queryKey: aiKeys.essayReview(applicationId ?? ''),
    queryFn: () => getEssayReview(applicationId!),
    enabled: Boolean(applicationId),
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? POLL_MS : false),
  });
}

export function useRegenerateEssayReview(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateEssayReview(applicationId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: aiKeys.essayReview(applicationId) });
      queryClient.invalidateQueries({ queryKey: aiKeys.usage() });
    },
  });
}

export function useScoreApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: scoreApplication,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rep'] }),
  });
}
