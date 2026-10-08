import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import Storage from 'expo-sqlite/kv-store';
import { AppState, Platform } from 'react-native';

const ONE_DAY = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Keep data long enough to be persisted and shown offline.
      gcTime: ONE_DAY,
      retry: 1,
      // Show cached data offline instead of a spinner (SRS 3.1.1.4).
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'offlineFirst' },
  },
});

/** Cached server data (colleges, applications) survives restarts so screens open offline. */
export const queryPersister = createAsyncStoragePersister({
  storage: Storage,
  key: 'collapp-query-cache',
  throttleTime: 2000,
});

export const PERSIST_MAX_AGE = ONE_DAY;

// Tell React Query when the device goes on/offline so it pauses and resumes requests.
onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener((state) => {
    setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  });
  return () => subscription.remove();
});

// Refetch stale queries when the app returns to the foreground.
AppState.addEventListener('change', (status) => {
  if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
});
