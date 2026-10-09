import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useIsOnline } from '@/hooks/useIsOnline';
import type { LocalDraft, PendingFile } from '@/lib/offline/db';
import { listLocalDrafts, listPendingFiles } from '@/lib/offline/outbox';
import { syncNow } from '@/lib/offline/sync';

type SyncStatus = 'idle' | 'syncing' | 'offline';

type SyncContextValue = {
  status: SyncStatus;
  isOnline: boolean;
  /** Unsynced drafts and files on this device. */
  localDrafts: LocalDraft[];
  pendingFiles: PendingFile[];
  lastSyncedAt: Date | null;
  /** Run a sync now (no-op while offline) and refresh affected screens. */
  requestSync: () => Promise<void>;
  /** Re-read the outbox after a local write. */
  refreshOutbox: () => Promise<void>;
};

const SyncContext = createContext<SyncContextValue | null>(null);

export const localKeys = {
  all: ['local'] as const,
  drafts: (userId: string) => ['local', 'drafts', userId] as const,
  files: (userId: string) => ['local', 'files', userId] as const,
};

/** Auto-sync for offline drafts (SRS 3.1.1.4): on sign-in, reconnect and app foreground. */
export function SyncProvider({ children }: { children: ReactNode }) {
  const { session, role } = useAuth();
  const userId = role === 'student' ? (session?.user.id ?? '') : '';
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const drafts = useQuery({
    queryKey: localKeys.drafts(userId),
    queryFn: () => listLocalDrafts(userId),
    enabled: Boolean(userId),
    networkMode: 'always',
    staleTime: Infinity,
  });
  const files = useQuery({
    queryKey: localKeys.files(userId),
    queryFn: () => listPendingFiles(userId),
    enabled: Boolean(userId),
    networkMode: 'always',
    staleTime: Infinity,
  });

  async function refreshOutbox() {
    await queryClient.invalidateQueries({ queryKey: localKeys.all });
  }

  async function requestSync() {
    if (!userId) return;
    setSyncing(true);
    try {
      const result = await syncNow(userId);
      if (result.synced > 0) setLastSyncedAt(new Date());
    } finally {
      setSyncing(false);
      // Refetch server data before dropping local copies so screens don't flash old values.
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await refreshOutbox();
    }
  }

  useEffect(() => {
    if (!userId) return;
    // Initial sync after sign-in/launch, deferred so it doesn't set state during the effect.
    void Promise.resolve().then(requestSync);
    const network = addNetworkStateListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) requestSync();
    });
    const appState = AppState.addEventListener('change', (next) => {
      if (next === 'active') requestSync();
    });
    return () => {
      network.remove();
      appState.remove();
    };
    // requestSync is recreated each render; re-subscribing only when the user changes is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <SyncContext
      value={{
        status: !isOnline ? 'offline' : syncing ? 'syncing' : 'idle',
        isOnline,
        localDrafts: drafts.data ?? [],
        pendingFiles: files.data ?? [],
        lastSyncedAt,
        requestSync,
        refreshOutbox,
      }}>
      {children}
    </SyncContext>
  );
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside <SyncProvider>');
  return ctx;
}
