import { useNetworkState } from 'expo-network';

/**
 * True unless the device reports no connection. Unknown states count as online
 * so the server stays the source of truth for submission (SRS 3.6.3).
 */
export function useIsOnline(): boolean {
  const state = useNetworkState();
  return state.isConnected !== false && state.isInternetReachable !== false;
}
