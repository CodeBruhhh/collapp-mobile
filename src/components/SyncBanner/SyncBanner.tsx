import { Notice } from '@/components/Notice';
import { useSync } from '@/context/SyncContext';

/**
 * Offline/sync status for the student's drafts (SDD 6.1 "local save indicator
 * and sync status"). Hidden when everything is online and synced.
 */
export function SyncBanner() {
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
    <Notice
      title={message}
      icon={status === 'offline' ? 'cloud-offline' : 'cloud-upload'}
      action={
        status === 'idle' && waiting > 0 ? { label: 'Sync now', onPress: requestSync } : undefined
      }
    />
  );
}
