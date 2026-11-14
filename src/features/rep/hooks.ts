import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import {
  deletePost,
  deleteProgram,
  deleteRequirement,
  getApplicant,
  getMyCollege,
  listPosts,
  listStagedDecisions,
  releaseDecisions,
  reviewDocument,
  savePost,
  saveProgram,
  saveRequirement,
  scheduleRelease,
  setApplicationStatus,
  stageDecision,
  unstageDecision,
  updateCollege,
  uploadCollegeLogo,
} from './api';
import {
  assignApplications,
  fetchProgramSeats,
  fetchQueueCounts,
  fetchQueuePage,
  fetchReviewers,
  type QueueFilters,
} from './queue';
import { deleteTemplate, listTemplates, saveTemplate } from './templates';

export const repKeys = {
  all: ['rep'] as const,
  college: (id: string) => ['rep', 'college', id] as const,
  posts: (id: string) => ['rep', 'posts', id] as const,
  queue: (id: string, filters: QueueFilters) => ['rep', 'queue', id, filters] as const,
  queueCounts: (id: string, filters: Partial<QueueFilters>) =>
    ['rep', 'queue-counts', id, filters] as const,
  seats: (id: string) => ['rep', 'seats', id] as const,
  reviewers: (id: string) => ['rep', 'reviewers', id] as const,
  templates: (id: string) => ['rep', 'templates', id] as const,
  applicant: (id: string) => ['rep', 'applicant', id] as const,
  staged: (id: string) => ['rep', 'staged', id] as const,
};

/** Decisions held for batch release, keyed by application id. */
export function useStagedDecisions() {
  const collegeId = useCollegeId();
  const query = useQuery({
    queryKey: repKeys.staged(collegeId),
    queryFn: () => listStagedDecisions(collegeId),
    enabled: Boolean(collegeId),
  });
  const byApplication = new Map((query.data ?? []).map((s) => [s.application_id, s]));
  return { ...query, byApplication };
}

/** Hold, withdraw, release and schedule batch decisions. */
export function useReleaseActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: repKeys.all });
  return {
    stage: useMutation({ mutationFn: stageDecision, onSuccess: refresh }),
    unstage: useMutation({ mutationFn: unstageDecision, onSuccess: refresh }),
    release: useMutation({
      mutationFn: (ids?: string[]) => releaseDecisions(ids),
      onSettled: refresh,
    }),
    schedule: useMutation({ mutationFn: scheduleRelease, onSuccess: refresh }),
  };
}

/** The signed-in rep's tenant id. */
export function useCollegeId(): string {
  return useAuth().profile?.college_id ?? '';
}

export function useMyCollege() {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.college(collegeId),
    queryFn: () => getMyCollege(collegeId),
    enabled: Boolean(collegeId),
  });
}

export function usePosts() {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.posts(collegeId),
    queryFn: () => listPosts(collegeId),
    enabled: Boolean(collegeId),
  });
}

/**
 * The review queue, a page at a time; the database filters, sorts and counts.
 * Changing filters keeps the old rows on screen until the new ones arrive.
 */
export function useReviewQueue(filters: QueueFilters, { enabled = true } = {}) {
  const collegeId = useCollegeId();
  const userId = useAuth().session?.user.id ?? '';
  return useInfiniteQuery({
    queryKey: repKeys.queue(collegeId, filters),
    queryFn: ({ pageParam }) => fetchQueuePage(collegeId, userId, filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      if (filters.shortlist) return undefined;
      const loaded = pages.reduce((n, p) => n + p.rows.length, 0);
      return last.rows.length && loaded < last.total ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
    enabled: enabled && Boolean(collegeId && userId),
  });
}

/** Status-tab and quick-view counts for the queue's current filters. */
export function useQueueCounts(
  filters: Pick<QueueFilters, 'programId' | 'assignee' | 'search' | 'view'>,
) {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.queueCounts(collegeId, filters),
    queryFn: () => fetchQueueCounts(filters),
    placeholderData: keepPreviousData,
    enabled: Boolean(collegeId),
  });
}

/** Admitted and held admissions per program, against its slots. */
export function useProgramSeats() {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.seats(collegeId),
    queryFn: fetchProgramSeats,
    enabled: Boolean(collegeId),
    // A Map doesn't survive JSON persistence.
    meta: { persist: false },
  });
}

/** The college's active representatives, for assigning reviews. */
export function useReviewers() {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.reviewers(collegeId),
    queryFn: fetchReviewers,
    enabled: Boolean(collegeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignApplications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (a: { ids: string[]; assignee: string | null }) =>
      assignApplications(a.ids, a.assignee),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: repKeys.all }),
  });
}

/** Saved message templates shared by the college's representatives. */
export function useTemplates() {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.templates(collegeId),
    queryFn: () => listTemplates(collegeId),
    enabled: Boolean(collegeId),
  });
}

export function useTemplateActions() {
  const queryClient = useQueryClient();
  const collegeId = useCollegeId();
  const refresh = () => queryClient.invalidateQueries({ queryKey: repKeys.templates(collegeId) });
  return {
    save: useMutation({
      mutationFn: (t: Omit<Parameters<typeof saveTemplate>[0], 'collegeId'>) =>
        saveTemplate({ ...t, collegeId }),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: deleteTemplate, onSuccess: refresh }),
  };
}

export function useApplicant(id: string | undefined) {
  return useQuery({
    queryKey: repKeys.applicant(id ?? ''),
    queryFn: () => getApplicant(id!),
    enabled: Boolean(id),
  });
}

/** Rep mutations; each refreshes the rep's cached data and the public college pages. */
export function useRepActions() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: repKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['colleges'] }),
    ]);
  return {
    updateCollege: useMutation({
      mutationFn: (a: { id: string; changes: Parameters<typeof updateCollege>[1] }) =>
        updateCollege(a.id, a.changes),
      onSuccess: refresh,
    }),
    uploadLogo: useMutation({
      mutationFn: (a: Parameters<typeof uploadCollegeLogo>) => uploadCollegeLogo(...a),
      onSuccess: refresh,
    }),
    saveProgram: useMutation({ mutationFn: saveProgram, onSuccess: refresh }),
    deleteProgram: useMutation({ mutationFn: deleteProgram, onSuccess: refresh }),
    saveRequirement: useMutation({ mutationFn: saveRequirement, onSuccess: refresh }),
    deleteRequirement: useMutation({ mutationFn: deleteRequirement, onSuccess: refresh }),
    savePost: useMutation({ mutationFn: savePost, onSuccess: refresh }),
    deletePost: useMutation({ mutationFn: deletePost, onSuccess: refresh }),
    reviewDocument: useMutation({
      mutationFn: (a: Parameters<typeof reviewDocument>) => reviewDocument(...a),
      onSuccess: refresh,
    }),
    setStatus: useMutation({
      mutationFn: (a: { id: string; changes: Parameters<typeof setApplicationStatus>[1] }) =>
        setApplicationStatus(a.id, a.changes),
      onSuccess: refresh,
    }),
  };
}
