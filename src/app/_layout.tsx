import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BiometricLockScreen } from '@/screens/auth/BiometricLockScreen';

// Keep the splash screen up until the stored session has been restored.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { role, needsOnboarding, isLoading, isLocked } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hide();
  }, [isLoading]);

  if (isLoading) return null;
  if (isLocked) return <BiometricLockScreen />;

  // Only the section matching the signed-in role is reachable. When `role`
  // changes (sign in / sign out) Expo Router redirects automatically.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={role === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'student' && needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'student' && !needsOnboarding}>
        <Stack.Screen name="student" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'school_rep'}>
        <Stack.Screen name="rep" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'admin'}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <AuthProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
