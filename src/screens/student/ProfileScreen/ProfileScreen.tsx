import { router } from 'expo-router';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { InfoRow } from '@/components/InfoRow';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { useStudentProfile } from '@/features/profile/hooks';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { AccountSettingsSections } from '@/screens/account/AccountSettingsSections';
import { spacing } from '@/styles';

const list = (values: string[] | undefined) => values?.join(', ');

/** SDD screen 18 — academic profile, appearance, notifications and security settings. */
export function ProfileScreen() {
  const { profile } = useAuth();
  const student = useStudentProfile();
  const photo = useProfilePhoto('Colleges you apply to can see this photo.');

  const s = student.data;
  const address = (s?.address ?? {}) as Record<string, string | undefined>;

  return (
    <Screen>
      <ProfileHeader
        name={profile?.full_name || 'Student'}
        email={profile?.email ?? ''}
        avatarPath={profile?.avatar_path}
        onEditPhoto={photo.editPhoto}
        photoBusy={photo.saving}
      />

      <Section title="Academic profile">
        {student.isPending ? (
          <LoadingState variant="inline" />
        ) : student.isError ? (
          <ErrorState error={student.error} onRetry={student.refetch} />
        ) : (
          <>
            <InfoRow label="Senior high school" value={s?.senior_high_school ?? undefined} />
            <InfoRow label="Strand / Track" value={s?.strand ?? undefined} />
            <InfoRow
              label="General weighted average"
              value={s?.gpa != null ? String(s.gpa) : undefined}
            />
            <InfoRow label="Target majors" value={list(s?.target_majors)} />
            <InfoRow label="Preferred locations" value={list(s?.preferred_locations)} />
            <InfoRow label="Areas of interest" value={list(s?.interests)} />
            <InfoRow label="Career goals" value={s?.career_goals ?? undefined} />
            <InfoRow
              label="Home address"
              value={
                address.isInternational
                  ? [address.fullAddress, address.country].filter(Boolean).join(', ')
                  : [address.city, address.province].filter(Boolean).join(', ')
              }
            />
            <View style={{ paddingTop: spacing.md }}>
              <Button
                variant="secondary"
                label="Edit academic profile"
                onPress={() => router.push('/student/edit-profile')}
              />
            </View>
          </>
        )}
      </Section>

      <AccountSettingsSections role="student" />
    </Screen>
  );
}
