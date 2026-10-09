import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import {
  deletePost,
  deleteProgram,
  deleteRequirement,
  getApplicant,
  getMyCollege,
  listApplicants,
  listPosts,
  reviewDocument,
  savePost,
  saveProgram,
  saveRequirement,
  setApplicationStatus,
  updateCollege,
  uploadCollegeLogo,
} from './api';

export const repKeys = {
  all: ['rep'] as const,
  college: (id: string) => ['rep', 'college', id] as const,
  posts: (id: string) => ['rep', 'posts', id] as const,
  applicants: (id: string) => ['rep', 'applicants', id] as const,
  applicant: (id: string) => ['rep', 'applicant', id] as const,
};

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

export function useApplicants() {
  const collegeId = useCollegeId();
  return useQuery({
    queryKey: repKeys.applicants(collegeId),
    queryFn: () => listApplicants(collegeId),
    enabled: Boolean(collegeId),
  });
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
