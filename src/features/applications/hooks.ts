import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';

import { getApplication, listMyApplications } from './api';

// Writes go through the offline outbox (./offline.ts) so they also work without a connection.

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
