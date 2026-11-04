import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/styles';

/**
 * Stack shared by the three role sections. Tabs live in (tabs) with their own
 * headers; detail screens beside it get a themed header with a back button and
 * set their title with <Stack.Screen options={{ title }} />.
 */
export function RoleStack() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerShadowVisible: false,
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { color: colors.onPrimary, fontFamily: fonts.regular, fontSize: 19 },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
