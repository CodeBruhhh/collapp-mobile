import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Alert, Text } from 'react-native';

import { Button } from '@/components/Button';
import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { InfoRow } from '@/components/InfoRow';
import { ProfileHeader } from '@/components/ProfileHeader';
import { Screen } from '@/components/Screen';
import { SettingsSection } from '@/components/SettingsSection';
import { ErrorState, LoadingState } from '@/components/StateView';
import { ToggleRow } from '@/components/ToggleRow';
import { useAuth } from '@/context/AuthContext';
import { usePreferences, type ThemeMode } from '@/context/PreferencesContext';
import type { AccountSettings, NotificationCategory } from '@/features/profile/api';
import {
  useAccountSettings,
  useSaveAccountSettings,
  useStudentProfile,
} from '@/features/profile/hooks';
import { useTheme } from '@/hooks/useTheme';
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
} from '@/lib/biometrics';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ProfileScreen.styles';

const THEME_OPTIONS: ChipOption<ThemeMode>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// The three alert types from SRS 3.1.4.4.
const NOTIFICATION_ROWS: { key: NotificationCategory; label: string; description: string }[] = [
  { key: 'messages', label: 'New messages', description: 'Replies from school representatives' },
  {
    key: 'application_updates',
    label: 'Application updates',
    description: 'When a status changes or action is needed',
  },
  { key: 'deadlines', label: 'Deadline reminders', description: 'Before an application is due' },
];

const list = (values: string[] | undefined) => values?.join(', ');

/** SDD screen 18 — academic profile, appearance, notifications and security settings. */
export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { session, profile, signOut } = useAuth();
  const userId = session?.user.id ?? '';
  const { themeMode, setThemeMode } = usePreferences();

  const student = useStudentProfile();
  const settings = useAccountSettings();
  const saveSettings = useSaveAccountSettings();
  const biometrics = useQuery({
    queryKey: ['biometrics', userId],
    queryFn: async () => ({
      available: await isBiometricAvailable(),
      enabled: await isBiometricEnabled(userId),
    }),
    enabled: Boolean(userId),
  });

  function updateSettings(next: AccountSettings) {
    saveSettings.mutate(next, {
      onError: (e) => Alert.alert('Could not save your settings', getErrorMessage(e)),
    });
  }

  async function toggleBiometrics(enable: boolean) {
    try {
      // Turning it on requires proving the biometric works on this device.
      if (enable && !(await authenticateWithBiometrics())) return;
      await setBiometricEnabled(userId, enable);
      await biometrics.refetch();
    } catch (e) {
      Alert.alert('Could not update biometric unlock', getErrorMessage(e));
    }
  }

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use CollApp.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  const s = student.data;
  const address = (s?.address ?? {}) as Record<string, string | undefined>;
  const current = settings.data;

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

      <SettingsSection title="Appearance">
        <FilterChips options={THEME_OPTIONS} selected={themeMode} onSelect={setThemeMode} />
      </SettingsSection>

      <SettingsSection title="Notifications">
        {settings.isPending ? (
          <LoadingState />
        ) : settings.isError || !current ? (
          <ErrorState error={settings.error} onRetry={settings.refetch} />
        ) : (
          <>
            <ToggleRow
              label="Push notifications"
              description="Alerts on this phone when the app is closed"
              value={current.pushEnabled}
              onChange={(pushEnabled) => updateSettings({ ...current, pushEnabled })}
            />
            {NOTIFICATION_ROWS.map((row) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                description={row.description}
                value={current.pushEnabled && current.notificationPrefs[row.key]}
                disabled={!current.pushEnabled}
                onChange={(enabled) =>
                  updateSettings({
                    ...current,
                    notificationPrefs: { ...current.notificationPrefs, [row.key]: enabled },
                  })
                }
              />
            ))}
            <Text style={styles.hint}>
              Everything still appears under the bell in the app, whatever you choose here.
            </Text>
          </>
        )}
      </SettingsSection>

      <SettingsSection title="Security">
        <ToggleRow
          label="Biometric unlock"
          description={
            biometrics.data?.available === false
              ? 'Set up Face ID or a fingerprint on this phone to use this.'
              : 'Use Face ID or your fingerprint to open CollApp.'
          }
          value={biometrics.data?.enabled ?? false}
          disabled={!biometrics.data?.available}
          onChange={toggleBiometrics}
        />
        <Button
          variant="secondary"
          label="Change password"
          onPress={() => router.push('/student/change-password')}
        />
      </SettingsSection>

      <Button label="Sign out" variant="secondary" onPress={confirmSignOut} />
    </Screen>
  );
}
