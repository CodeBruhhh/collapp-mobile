import Storage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'collapp.preferences.v1';

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

/**
 * Reads the saved theme synchronously so the first frame already uses it (no
 * light flash for dark-mode users). Defensive: a corrupted or older value can
 * never crash the app.
 */
function loadThemeMode(): ThemeMode {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as { themeMode?: unknown }) : null;
    return isThemeMode(saved?.themeMode) ? saved.themeMode : 'system';
  } catch {
    return 'system';
  }
}

type PreferencesContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Device-level appearance preference (SRS 3.2.1, SDD screen 18). Notification
 * preferences live with the account in Supabase so the server can honour them.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(loadThemeMode);

  // Apply app-wide; useTheme() follows Appearance. 'unspecified' = follow the device.
  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
    Storage.setItem(STORAGE_KEY, JSON.stringify({ themeMode })).catch(() => {});
  }, [themeMode]);

  return <PreferencesContext value={{ themeMode, setThemeMode }}>{children}</PreferencesContext>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
