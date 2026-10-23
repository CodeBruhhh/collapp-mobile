import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Enums } from '@/types/database';

import {
  createCollege,
  fetchAdminStats,
  fetchPlatformSettings,
  fetchRlsOverview,
  listAllColleges,
  listAuditLogs,
  listBlockedAttachments,
  listUsers,
  sendBroadcast,
  setCollegeStatus,
  setUserStatus,
  updatePlatformSettings,
  type Audience,
  type PlatformSettings,
} from './api';

export const adminKeys = {
  all: ['admin'] as const,
  stats: () => ['admin', 'stats'] as const,
  /** Read by every role (maintenance gate, featured colleges), so not under 'admin'. */
  settings: () => ['platform-settings'] as const,
  users: (search: string) => ['admin', 'users', search] as const,
  colleges: () => ['admin', 'colleges'] as const,
  audit: (prefix: string | null) => ['admin', 'audit', prefix] as const,
  blocked: () => ['admin', 'blocked'] as const,
  rls: () => ['admin', 'rls'] as const,
};

export const useAdminStats = () =>
  useQuery({ queryKey: adminKeys.stats(), queryFn: fetchAdminStats });

/** Platform switches; re-checked every minute so maintenance mode reaches open apps. */
export const usePlatformSettings = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.settings(),
    queryFn: fetchPlatformSettings,
    refetchInterval: 60_000,
    enabled,
  });

export const useUsers = (search: string) =>
  useQuery({ queryKey: adminKeys.users(search), queryFn: () => listUsers(search) });

export const useAllColleges = () =>
  useQuery({ queryKey: adminKeys.colleges(), queryFn: listAllColleges });

export const useAuditLogs = (prefix: string | null) =>
  useQuery({ queryKey: adminKeys.audit(prefix), queryFn: () => listAuditLogs(prefix) });

export const useBlockedAttachments = () =>
  useQuery({ queryKey: adminKeys.blocked(), queryFn: listBlockedAttachments });

export const useRlsOverview = () =>
  useQuery({ queryKey: adminKeys.rls(), queryFn: fetchRlsOverview });

/** Every admin write; each refreshes the whole admin cache (small, admin-only data). */
export function useAdminActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.all });

  const savePlatformSettings = useMutation({
    mutationFn: (changes: Partial<PlatformSettings>) => updatePlatformSettings(changes),
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.settings() });
      const previous = queryClient.getQueryData<PlatformSettings>(adminKeys.settings());
      if (previous) queryClient.setQueryData(adminKeys.settings(), { ...previous, ...changes });
      return { previous };
    },
    onError: (_e, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(adminKeys.settings(), context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() });
      refresh();
    },
  });
  const userStatus = useMutation({
    mutationFn: ([id, status]: [string, Enums<'account_status'>]) => setUserStatus(id, status),
    onSettled: refresh,
  });
  const collegeStatus = useMutation({
    mutationFn: ([id, status]: [string, Enums<'publish_status'>]) => setCollegeStatus(id, status),
    onSettled: refresh,
  });
  const addCollege = useMutation({ mutationFn: createCollege, onSettled: refresh });
  const broadcast = useMutation({
    mutationFn: ([title, body, audience]: [string, string, Audience]) =>
      sendBroadcast(title, body, audience),
    onSettled: refresh,
  });

  return { savePlatformSettings, userStatus, collegeStatus, addCollege, broadcast };
}
