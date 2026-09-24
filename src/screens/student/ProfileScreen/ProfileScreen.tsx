import { Alert, Text } from 'react-native';

import { Button } from '@/components/Button';

import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { InfoRow } from '@/components/InfoRow';
import { ProfileHeader } from '@/components/ProfileHeader';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { SettingsSection } from '@/components/SettingsSection';
import { ToggleRow } from '@/components/ToggleRow';
import {
  usePreferences,
  type NotificationKey,
  type ThemeMode,
} from '@/context/PreferencesContext';
import { useQuery } from '@/hooks/useQuery';
import { useTheme } from '@/hooks/useTheme';
import { getProfile } from '@/services/profile';

import { createStyles } from './ProfileScreen.styles';
import { useAuth } from '@/context/AuthContext';

const THEME_OPTIONS: ChipOption<ThemeMode>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

// The three alert types from SRS 3.1.4.4.
const NOTIFICATION_ROWS: { key: NotificationKey; label: string; description: string }[] = [
  { key: 'messages', label: 'New messages', description: 'Replies from school representatives' },
  {
    key: 'applicationStatus',
    label: 'Application updates',
    description: 'When a status changes or action is needed',
  },
  { key: 'deadlines', label: 'Deadline reminders', description: 'Before an application is due' },
];

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const profile = useQuery(getProfile);
  const { themeMode, setThemeMode, notifications, setNotification } = usePreferences();
  const { signOut } = useAuth();

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to use CollApp.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);

  return (
    <Screen>
      <QueryState query={profile}>
        {(p) => (
          <>
            <ProfileHeader name={p.fullName} email={p.email} />

            <SettingsSection title="Academic profile">
              <InfoRow label="Academic background" value={p.academicBackground} />
              <InfoRow label="Target majors" value={p.targetMajors.join(', ')} />
              <InfoRow label="Preferred locations" value={p.preferredLocations.join(', ')} />
              <Text style={styles.hint}>Editing your profile is coming soon.</Text>
            </SettingsSection>
          </>
        )}
      </QueryState>

      <SettingsSection title="Appearance">
        <FilterChips options={THEME_OPTIONS} selected={themeMode} onSelect={setThemeMode} />
      </SettingsSection>

      <SettingsSection title="Notifications">
        {NOTIFICATION_ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            description={row.description}
            value={notifications[row.key]}
            onValueChange={(enabled) => setNotification(row.key, enabled)}
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Security">
        <ToggleRow
          label="Biometric unlock"
          description="Face ID or fingerprint. Available once sign-in is set up."
          value={false}
          onValueChange={() => {}}
          disabled
        />
      </SettingsSection>

      <Button label="Sign out" variant="secondary" onPress={confirmSignOut} />
    </Screen>
  );
}
