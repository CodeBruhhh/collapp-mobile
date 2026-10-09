import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';

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
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
