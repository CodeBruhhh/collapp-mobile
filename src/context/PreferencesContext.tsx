import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export type NotificationPrefs = {
  /** New messages from school representatives. */
  messages: boolean;
  /** Application status changes. */
  applicationStatus: boolean;
  /** Upcoming application deadlines. */
  deadlines: boolean;
};
export type NotificationKey = keyof NotificationPrefs;

type Preferences = {
  themeMode: ThemeMode;
  notifications: NotificationPrefs;
};

const STORAGE_KEY = 'collapp.preferences.v1';

const DEFAULTS: Preferences = {
  themeMode: 'system',
  notifications: { messages: true, applicationStatus: true, deadlines: true },
};

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

/** Reads saved JSON defensively so a corrupted or older value can never crash the app. */
function parsePreferences(raw: string): Preferences {
  try {
    const saved = JSON.parse(raw) as {
      themeMode?: unknown;
      notifications?: Record<string, unknown>;
    };
    const notifications = { ...DEFAULTS.notifications };
    for (const key of Object.keys(notifications) as NotificationKey[]) {
      const value = saved.notifications?.[key];
      if (typeof value === 'boolean') notifications[key] = value;
    }
    return {
      themeMode: isThemeMode(saved.themeMode) ? saved.themeMode : DEFAULTS.themeMode,
      notifications,
    };
  } catch {
    return DEFAULTS;
  }
}

type PreferencesContextValue = {
  themeMode: ThemeMode;
  notifications: NotificationPrefs;
  setThemeMode: (mode: ThemeMode) => void;
  setNotification: (key: NotificationKey, enabled: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

// TODO(supabase): the SDD stores theme and notification preferences with the
// user. Once accounts exist, sync these to the backend as well.
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  // Load saved preferences once at launch.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPrefs(parsePreferences(raw));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // The splash screen (kept up by the root layout) hides only after the saved
  // theme is known, so a dark-mode user never sees a light flash.
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  // Apply the theme app-wide. 'unspecified' means "follow the device setting".
  useEffect(() => {
    Appearance.setColorScheme(prefs.themeMode === 'system' ? 'unspecified' : prefs.themeMode);
  }, [prefs.themeMode]);

  // Persist changes, but never overwrite the saved value before it has loaded.
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs, loaded]);

  const setThemeMode = useCallback((themeMode: ThemeMode) => {
    setPrefs((p) => ({ ...p, themeMode }));
  }, []);

  const setNotification = useCallback((key: NotificationKey, enabled: boolean) => {
    setPrefs((p) => ({ ...p, notifications: { ...p.notifications, [key]: enabled } }));
  }, []);

  return (
    <PreferencesContext
      value={{
        themeMode: prefs.themeMode,
        notifications: prefs.notifications,
        setThemeMode,
        setNotification,
      }}>
      {children}
    </PreferencesContext>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
