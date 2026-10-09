import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import {
  fetchAccountSettings,
  fetchStudentProfile,
  saveAccountSettings,
  type AccountSettings,
} from './api';

export const profileKeys = {
  student: (userId: string) => ['profile', userId, 'student'] as const,
  settings: (userId: string) => ['profile', userId, 'settings'] as const,
};

/** The signed-in student's academic profile (public.students). */
export function useStudentProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: profileKeys.student(userId),
    queryFn: () => fetchStudentProfile(userId),
    enabled: Boolean(userId),
  });
}

export function useAccountSettings() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: profileKeys.settings(userId),
    queryFn: () => fetchAccountSettings(userId),
    enabled: Boolean(userId),
  });
}

/** Optimistic: switches flip at once and roll back if the save fails. */
export function useSaveAccountSettings() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const key = profileKeys.settings(userId);

  return useMutation({
    mutationFn: (settings: AccountSettings) => saveAccountSettings(userId, settings),
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<AccountSettings>(key);
      queryClient.setQueryData(key, settings);
      return { previous };
    },
    onError: (_error, _settings, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
