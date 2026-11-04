import { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { saveProfilePhoto } from '@/features/profile/api';
import { ask, notify } from '@/lib/feedback';
import { pickPhoto } from '@/lib/pickers';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

/** Add, replace or remove the signed-in person's photo; `visibility` says who sees it. */
export function useProfilePhoto(visibility: string) {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  async function save(file: LocalFile | null) {
    if (!profile) return;
    setSaving(true);
    try {
      await saveProfilePhoto(profile.id, file, profile.avatar_path);
      await refreshProfile();
    } catch (e) {
      notify.error('Could not update your photo', getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function choose(source: 'camera' | 'library') {
    try {
      const file = await pickPhoto(source, { square: true });
      if (file) await save(file);
    } catch (e) {
      notify.error('Could not add your photo', getErrorMessage(e));
    }
  }

  function editPhoto() {
    ask('Profile photo', visibility, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from library', onPress: () => choose('library') },
      { text: 'Take a photo', onPress: () => choose('camera') },
      ...(profile?.avatar_path
        ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => save(null) }]
        : []),
    ]);
  }

  return { editPhoto, saving };
}
