import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { LibreBaskerville_400Regular } from '@expo-google-fonts/libre-baskerville';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { FeedbackHost } from '@/components/FeedbackHost';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LiveUpdates } from '@/context/LiveUpdates';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { SyncProvider } from '@/context/SyncContext';
import { usePlatformSettings } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';
import {
  PERSIST_MAX_AGE,
  queryClient,
  queryPersister,
  shouldPersistQuery,
} from '@/lib/queryClient';
import { BiometricLockScreen } from '@/screens/auth/BiometricLockScreen';
import { MaintenanceScreen } from '@/screens/MaintenanceScreen';

// Keep the splash screen up until the stored session has been restored.
SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { role, needsOnboarding, isLoading, isLocked } = useAuth();
  // Administrators are never locked out by maintenance mode.
  const platform = usePlatformSettings(role !== null && role !== 'admin');

  const ready = fontsReady && !isLoading;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;
  if (isLocked) return <BiometricLockScreen />;
  if (role && role !== 'admin' && platform.data?.maintenance_mode) return <MaintenanceScreen />;

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
  // A failed font load falls back to the system face rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    LibreBaskerville_400Regular,
  });

  return (
    <PreferencesProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: PERSIST_MAX_AGE,
          dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
        }}>
        <AuthProvider>
          <SyncProvider>
            <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
              <StatusBar style={isDark ? 'dark' : 'light'} />
              <RootNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
              <FeedbackHost />
            </ThemeProvider>
          </SyncProvider>
        </AuthProvider>
      </PersistQueryClientProvider>
    </PreferencesProvider>
  );
}
