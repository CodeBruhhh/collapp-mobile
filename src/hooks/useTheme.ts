import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

import {
  darkColors,
  defaultTokens,
  lightColors,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

type ThemeOverride = { light: ThemeColors; dark: ThemeColors; tokens: ThemeTokens };

/** Lets a section (the admin console) swap the palette and tokens for its subtree. */
export const ThemeOverrideContext = createContext<ThemeOverride | null>(null);

/** Light/dark palette that follows the device setting (SRS 3.2.1). */
export function useTheme(): { colors: ThemeColors; isDark: boolean; tokens: ThemeTokens } {
  const scheme = useColorScheme();
  const override = useContext(ThemeOverrideContext);
  const isDark = scheme === 'dark';
  const colors = isDark ? (override?.dark ?? darkColors) : (override?.light ?? lightColors);
  return { colors, isDark, tokens: override?.tokens ?? defaultTokens };
}
