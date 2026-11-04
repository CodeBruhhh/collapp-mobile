import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';
import { AuthLayout } from '@/screens/auth/AuthLayout';
import { createAuthStyles } from '@/screens/auth/authStyles';

/** Shown to students and representatives while an administrator has maintenance mode on. */
export function MaintenanceScreen() {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const { signOut } = useAuth();
  const settings = usePlatformSettings();

  return (
    <AuthLayout eyebrow="Maintenance" title="CollApp is under maintenance">
      <View style={styles.lockMark}>
        <Icon name="construct" size={56} color={colors.primary} />
      </View>
      <Text style={styles.bodyText}>
        We&apos;re making improvements and will be back shortly. Your drafts and documents are safe.
      </Text>
      <View style={styles.actions}>
        <Button
          label="Check again"
          onPress={() => settings.refetch()}
          loading={settings.isFetching}
        />
        <Button variant="link" label="Sign out" onPress={signOut} />
      </View>
    </AuthLayout>
  );
}
