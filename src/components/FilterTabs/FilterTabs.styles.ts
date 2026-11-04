import { StyleSheet } from 'react-native';

import { fonts, fontSize, TOUCH_TARGET, type ThemeColors } from '@/styles';

/** Plain text tabs; the active one is underlined like the tab bar indicator. */
export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: 20 },
    tab: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: c.primary },
    label: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: c.textMuted },
    labelActive: { color: c.primary, fontFamily: fonts.semibold },
  });
