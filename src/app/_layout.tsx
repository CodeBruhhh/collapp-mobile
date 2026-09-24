import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { useTheme } from "@/hooks/useTheme";

// Keep the splash screen up until saved preferences load (PreferencesProvider hides it).
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { role } = useAuth();

  // Only the section matching the signed-in role is reachable. When `role`
  // changes (sign in / sign out) Expo Router redirects automatically.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={role === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={role === "student"}>
        <Stack.Screen name="student" />
      </Stack.Protected>
      <Stack.Protected guard={role === "school_rep"}>
        <Stack.Screen name="rep" />
      </Stack.Protected>
      <Stack.Protected guard={role === "admin"}>
        <Stack.Screen name="admin" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const { isDark } = useTheme();

  return (
    <PreferencesProvider>
      <AuthProvider>
        <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
          <StatusBar style="auto" />
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
