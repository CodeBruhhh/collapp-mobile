import { createContext, useMemo, type ReactNode } from 'react';

import { brandAccent, brandPalette, type BrandColors } from '@/features/theme/palette';
import { darkColors, lightColors, type ThemeColors } from '@/styles';

export type BrandOverride = {
  light: ThemeColors;
  dark: ThemeColors;
  /** Icon/mark colour per theme, at least 3:1 against the page. */
  accent: { light: string; dark: string };
  /** The college's own secondary and accent, as chosen (decorative stripe). */
  stripe: [string, string];
};

export const BrandThemeContext = createContext<BrandOverride | null>(null);

/**
 * Repaints everything inside in a college's colours: every component that
 * reads useTheme() (buttons, tabs, badges, the masthead) follows. Null keeps
 * CollApp's own colours.
 */
export function BrandTheme({
  brand,
  children,
}: {
  brand: BrandColors | null;
  children: ReactNode;
}) {
  const primary = brand?.primary;
  const secondary = brand?.secondary;
  const accent = brand?.accent;
  const value = useMemo<BrandOverride | null>(() => {
    if (!primary || !secondary || !accent) return null;
    const colors = { primary, secondary, accent };
    return {
      light: brandPalette(lightColors, colors, false),
      dark: brandPalette(darkColors, colors, true),
      accent: {
        light: brandAccent(lightColors, colors, false),
        dark: brandAccent(darkColors, colors, true),
      },
      stripe: [secondary, accent],
    };
  }, [primary, secondary, accent]);

  return <BrandThemeContext value={value}>{children}</BrandThemeContext>;
}
