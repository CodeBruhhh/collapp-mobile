import { LibreBaskerville_400Regular, useFonts } from '@expo-google-fonts/libre-baskerville';
import type { ReactNode } from 'react';

import { ThemeOverrideContext } from '@/hooks/useTheme';
import { editorialDarkColors, editorialLightColors, editorialTokens } from '@/styles';

/** "Editorial Teal" for everything below it; headings use the system face until the serif loads. */
export function EditorialTheme({ children }: { children: ReactNode }) {
  const [fontsLoaded] = useFonts({ LibreBaskerville_400Regular });
  const tokens = fontsLoaded
    ? { ...editorialTokens, headingFont: 'LibreBaskerville_400Regular' }
    : editorialTokens;

  return (
    <ThemeOverrideContext.Provider
      value={{ light: editorialLightColors, dark: editorialDarkColors, tokens }}>
      {children}
    </ThemeOverrideContext.Provider>
  );
}
