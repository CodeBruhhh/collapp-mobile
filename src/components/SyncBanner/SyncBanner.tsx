import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { useSync } from '@/context/SyncContext';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SyncBanner.styles';

/**
 * Offline/sync status for the student's drafts (SDD 6.1 "local save indicator
 * and sync status"). Hidden when everything is online and synced.
 */
export function SyncBanner() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { status, localDrafts, pendingFiles, requestSync } = useSync();

  const waiting = localDrafts.length + pendingFiles.length;
  const conflicts = localDrafts.filter((d) => d.conflict_json).length;
  if (status !== 'offline' && waiting === 0) return null;

  const message =
    status === 'offline'
      ? waiting
        ? `You're offline. ${waiting} change${waiting === 1 ? '' : 's'} saved on this device.`
        : "You're offline. Drafts you edit are saved on this device."
      : conflicts
        ? 'A draft was changed elsewhere. Open it to choose which version to keep.'
        : status === 'syncing'
          ? `Syncing ${waiting} change${waiting === 1 ? '' : 's'}…`
          : `${waiting} change${waiting === 1 ? '' : 's'} waiting to sync.`;

  return (
    <View style={styles.banner} accessibilityLiveRegion="polite">
      <Ionicons
        name={status === 'offline' ? 'cloud-offline-outline' : 'cloud-upload-outline'}
        size={18}
        color={colors.text}
        accessibilityElementsHidden
      />
      <Text style={styles.text}>{message}</Text>
      {status === 'idle' && waiting > 0 ? (
        <Pressable accessibilityRole="button" onPress={requestSync} style={styles.action}>
          <Text style={styles.actionText}>Sync now</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
