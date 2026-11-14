import { useContext } from 'react';
import { useColorScheme } from 'react-native';

import { BrandThemeContext } from '@/context/BrandThemeContext';
import { darkColors, lightColors, type ThemeColors } from '@/styles';

export type Brand = {
  /** Icons and marks in the college's accent (readable on the page). */
  accent: string;
  /** The college's secondary and accent colours for decorative stripes. */
  stripe: [string, string];
};

/**
 * Light/dark palette that follows the device setting (SRS 3.2.1). Inside a
 * <BrandTheme> (a college page) the palette carries that college's colours,
 * and `brand` is set.
 */
export function useTheme(): { colors: ThemeColors; isDark: boolean; brand: Brand | null } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const override = useContext(BrandThemeContext);
  if (!override) return { colors: isDark ? darkColors : lightColors, isDark, brand: null };
  return {
    colors: isDark ? override.dark : override.light,
    isDark,
    brand: {
      accent: isDark ? override.accent.dark : override.accent.light,
      stripe: override.stripe,
    },
  };
}
