import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './MaintenanceScreen.styles';

/** Shown to students and representatives while an administrator has maintenance mode on. */
export function MaintenanceScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { signOut } = useAuth();
  const settings = usePlatformSettings();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Ionicons name="construct-outline" size={56} color={colors.primary} />
        <Text accessibilityRole="header" style={styles.title}>
          CollApp is under maintenance
        </Text>
        <Text style={styles.body}>
          We&apos;re making improvements and will be back shortly. Your drafts and documents are
          safe.
        </Text>
        <Button
          label="Check again"
          onPress={() => settings.refetch()}
          loading={settings.isFetching}
        />
        <Button variant="link" label="Sign out" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
