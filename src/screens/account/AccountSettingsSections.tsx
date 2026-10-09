import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { Alert, Text } from 'react-native';

import { Button } from '@/components/Button';
import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { SettingsSection } from '@/components/SettingsSection';
import { ErrorState, LoadingState } from '@/components/StateView';
import { ToggleRow } from '@/components/ToggleRow';
import { useAuth } from '@/context/AuthContext';
import { usePreferences, type ThemeMode } from '@/context/PreferencesContext';
import type { AccountSettings, NotificationCategory } from '@/features/profile/api';
import { useAccountSettings, useSaveAccountSettings } from '@/features/profile/hooks';
import { useTheme } from '@/hooks/useTheme';
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
} from '@/lib/biometrics';
import { getErrorMessage } from '@/lib/validation';
import type { Role } from '@/types/roles';

import { createAccountStyles } from './accountStyles';

const THEME_OPTIONS: ChipOption<ThemeMode>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type NotificationRow = { key: NotificationCategory; label: string; description: string };

/** The push categories each role actually receives (SRS 3.1.4.4). */
const NOTIFICATION_ROWS: Record<Role, NotificationRow[]> = {
  student: [
    { key: 'messages', label: 'New messages', description: 'Replies from school representatives' },
    {
      key: 'application_updates',
      label: 'Application updates',
      description: 'When a status changes or action is needed',
    },
    { key: 'deadlines', label: 'Deadline reminders', description: 'Before an application is due' },
  ],
  school_rep: [
    {
      key: 'messages',
      label: 'New messages',
      description: 'Inquiries from students and the administrator',
    },
    {
      key: 'application_updates',
      label: 'New applications',
      description: 'When a student applies to your college',
    },
  ],
  admin: [{ key: 'messages', label: 'New messages', description: 'From school representatives' }],
};

const CHANGE_PASSWORD_ROUTE: Record<Role, Href> = {
  student: '/student/change-password',
  school_rep: '/rep/change-password',
  admin: '/admin/change-password',
};

/**
 * Settings shared by every role's Profile & Settings screen (SDD 18):
 * appearance, push preferences, security and sign-out.
 */
export function AccountSettingsSections({ role }: { role: Role }) {
  const { colors } = useTheme();
  const styles = createAccountStyles(colors);
  const { session, signOut } = useAuth();
  const userId = session?.user.id ?? '';
  const { themeMode, setThemeMode } = usePreferences();

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

  const current = settings.data;

  return (
    <>
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
            {NOTIFICATION_ROWS[role].map((row) => (
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
          onPress={() => router.push(CHANGE_PASSWORD_ROUTE[role])}
        />
      </SettingsSection>

      <Button label="Sign out" variant="secondary" onPress={confirmSignOut} />
    </>
  );
}
