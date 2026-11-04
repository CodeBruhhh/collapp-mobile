import { Stack } from 'expo-router';

import { InfoRow } from '@/components/InfoRow';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { useAuth } from '@/context/AuthContext';
import { useMyCollege } from '@/features/rep/hooks';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { ROLE_LABELS } from '@/types/roles';

import { AccountSettingsSections } from '../AccountSettingsSections';

/** The representative's college (its own component so only reps query it). */
function RepCollegeRow() {
  const college = useMyCollege();
  return <InfoRow label="College" value={college.data?.name} />;
}

/** SDD screen 18 for representatives and administrators: account details and settings. */
export function AccountScreen() {
  const { profile, role } = useAuth();
  const photo = useProfilePhoto('Shown on your account and in the header.');
  if (!profile || !role) return null;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Profile & settings' }} />
      <ProfileHeader
        name={profile.full_name || ROLE_LABELS[role]}
        email={profile.email}
        avatarPath={profile.avatar_path}
        onEditPhoto={role === 'school_rep' ? photo.editPhoto : undefined}
        photoBusy={photo.saving}
      />

      <Section title="Account">
        <InfoRow label="Role" value={ROLE_LABELS[role]} />
        {role === 'school_rep' ? <RepCollegeRow /> : null}
      </Section>

      <AccountSettingsSections role={role} />
    </Screen>
  );
}
