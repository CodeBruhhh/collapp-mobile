import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import {
  attachDocument,
  createDraft,
  deleteDraft,
  getApplication,
  listMyApplications,
  removeDocument,
  submitApplication,
  updateDraft,
} from './api';

export const applicationKeys = {
  all: ['applications'] as const,
  mine: (userId: string) => ['applications', 'mine', userId] as const,
  detail: (id: string) => ['applications', 'detail', id] as const,
};

export function useMyApplications() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: applicationKeys.mine(userId),
    queryFn: () => listMyApplications(userId),
    enabled: Boolean(userId),
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => getApplication(id!),
    enabled: Boolean(id),
  });
}

/** Mutations for the signed-in student's applications; each refreshes the affected queries. */
export function useApplicationActions() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: applicationKeys.all });

  return {
    createDraft: useMutation({
      mutationFn: (input: Omit<Parameters<typeof createDraft>[0], 'studentId'>) =>
        createDraft({ ...input, studentId: userId }),
      onSuccess: refresh,
    }),
    updateDraft: useMutation({
      mutationFn: ({ id, changes }: { id: string; changes: Parameters<typeof updateDraft>[1] }) =>
        updateDraft(id, changes),
      onSuccess: refresh,
    }),
    deleteDraft: useMutation({ mutationFn: deleteDraft, onSuccess: refresh }),
    attachDocument: useMutation({
      mutationFn: (input: Omit<Parameters<typeof attachDocument>[0], 'userId'>) =>
        attachDocument({ ...input, userId }),
      onSuccess: refresh,
    }),
    removeDocument: useMutation({ mutationFn: removeDocument, onSuccess: refresh }),
    submit: useMutation({ mutationFn: submitApplication, onSuccess: refresh }),
  };
}
