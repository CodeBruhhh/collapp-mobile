import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight } from '@/styles';

/**
 * Stack shared by the three role sections. Tabs live in (tabs) with their own
 * headers; detail screens beside it get a themed header with a back button and
 * set their title with <Stack.Screen options={{ title }} />.
 */
export function RoleStack() {
  const { colors, tokens } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: tokens.editorial ? colors.background : colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: tokens.editorial
          ? { color: colors.text, fontSize: 19, fontWeight: fontWeight.regular }
          : { color: colors.text, fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: {
          backgroundColor: colors.background,
          // Native stack headers take no border, so the rule sits on top of the page.
          ...(tokens.editorial && {
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }),
        },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
