import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import {
  getCollege,
  listColleges,
  listFollowedCollegeIds,
  setFollowing,
  type CollegeFilters,
} from './api';

export const collegeKeys = {
  list: (filters: CollegeFilters) => ['colleges', 'list', filters] as const,
  detail: (id: string) => ['colleges', 'detail', id] as const,
  follows: (userId: string) => ['colleges', 'follows', userId] as const,
};

export function useColleges(filters: CollegeFilters) {
  return useQuery({ queryKey: collegeKeys.list(filters), queryFn: () => listColleges(filters) });
}

export function useCollege(id: string | undefined) {
  return useQuery({
    queryKey: collegeKeys.detail(id ?? ''),
    queryFn: () => getCollege(id!),
    enabled: Boolean(id),
  });
}

export function useFollowedColleges() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  return useQuery({
    queryKey: collegeKeys.follows(userId),
    queryFn: () => listFollowedCollegeIds(userId),
    enabled: Boolean(userId),
  });
}

export function useToggleFollow() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user.id ?? '';
  return useMutation({
    mutationFn: ({ collegeId, following }: { collegeId: string; following: boolean }) =>
      setFollowing(userId, collegeId, following),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: collegeKeys.follows(userId) }),
  });
}
