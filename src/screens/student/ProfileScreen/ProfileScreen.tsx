import { router } from 'expo-router';
import { Text } from 'react-native';

import { Button } from '@/components/Button';
import { InfoRow } from '@/components/InfoRow';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Screen } from '@/components/Screen';
import { SettingsSection } from '@/components/SettingsSection';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { useStudentProfile } from '@/features/profile/hooks';
import { useTheme } from '@/hooks/useTheme';
import { AccountSettingsSections } from '@/screens/account/AccountSettingsSections';

import { createStyles } from './ProfileScreen.styles';

const list = (values: string[] | undefined) => values?.join(', ');

/** SDD screen 18 — academic profile, appearance, notifications and security settings. */
export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { profile } = useAuth();
  const student = useStudentProfile();

  const s = student.data;
  const address = (s?.address ?? {}) as Record<string, string | undefined>;

  return (
    <Screen>
      <ProfileHeader name={profile?.full_name || 'Student'} email={profile?.email ?? ''} />

      <SettingsSection title="Academic profile">
        {student.isPending ? (
          <LoadingState />
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
            <Button
              variant="secondary"
              label="Edit academic profile"
              onPress={() => router.push('/student/edit-profile')}
            />
            <Text style={styles.hint}>
              Your matches are refreshed automatically after you save changes.
            </Text>
          </>
        )}
      </SettingsSection>

      <AccountSettingsSections role="student" />
    </Screen>
  );
}
