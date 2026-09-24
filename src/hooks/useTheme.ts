import { useColorScheme } from 'react-native';

import { darkColors, lightColors, type ThemeColors } from '@/styles';

/** Light/dark palette that follows the device setting (SRS 3.2.1). */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
