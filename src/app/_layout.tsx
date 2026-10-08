import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LiveUpdates } from '@/context/LiveUpdates';
import { SyncProvider } from '@/context/SyncContext';
import { useTheme } from '@/hooks/useTheme';
import { PERSIST_MAX_AGE, queryClient, queryPersister } from '@/lib/queryClient';
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
    <>
      {role && !needsOnboarding ? <LiveUpdates /> : null}
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
    </>
  );
}

export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE }}>
      <AuthProvider>
        <SyncProvider>
          <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
            <StatusBar style="auto" />
            <RootNavigator />
          </ThemeProvider>
        </SyncProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}
