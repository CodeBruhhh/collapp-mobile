import Storage from 'expo-sqlite/kv-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

type SavedPreferences = {
  themeMode: ThemeMode;
  /** Representatives: paint the whole app in their college's page colours. */
  collegeColors: boolean;
};

const STORAGE_KEY = 'collapp.preferences.v1';

const DEFAULTS: SavedPreferences = { themeMode: 'system', collegeColors: false };

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark';

/**
 * Reads the saved preferences synchronously so the first frame already uses
 * them (no light flash for dark-mode users). Defensive: a corrupted or older
 * value can never crash the app.
 */
function loadPreferences(): SavedPreferences {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    const saved = raw
      ? (JSON.parse(raw) as Partial<Record<keyof SavedPreferences, unknown>>)
      : null;
    return {
      themeMode: isThemeMode(saved?.themeMode) ? saved.themeMode : DEFAULTS.themeMode,
      collegeColors: saved?.collegeColors === true,
    };
  } catch {
    return DEFAULTS;
  }
}

type PreferencesContextValue = SavedPreferences & {
  setThemeMode: (mode: ThemeMode) => void;
  setCollegeColors: (enabled: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Device-level appearance preferences (SRS 3.2.1, SDD screen 18). Notification
 * preferences live with the account in Supabase so the server can honour them.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<SavedPreferences>(loadPreferences);
  const { themeMode } = prefs;

  // Apply app-wide; useTheme() follows Appearance. 'unspecified' = follow the device.
  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? 'unspecified' : themeMode);
  }, [themeMode]);

  useEffect(() => {
    Storage.setItem(STORAGE_KEY, JSON.stringify(prefs)).catch(() => {});
  }, [prefs]);

  return (
    <PreferencesContext
      value={{
        ...prefs,
        setThemeMode: (mode) => setPrefs((p) => ({ ...p, themeMode: mode })),
        setCollegeColors: (enabled) => setPrefs((p) => ({ ...p, collegeColors: enabled })),
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
