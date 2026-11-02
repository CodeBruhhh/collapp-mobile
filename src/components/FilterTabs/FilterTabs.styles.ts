import { StyleSheet } from 'react-native';

import {
  fontSize,
  fontWeight,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

/** Neutral pills (underlined text tabs in the editorial theme): the dark fill marks the active filter without competing with the accent. */
export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    row: { gap: spacing.sm },
    tab: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    tabActive: { backgroundColor: c.text, borderColor: c.text },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.textMuted },
    labelActive: { color: c.surface, fontWeight: fontWeight.semibold },
    // Editorial: plain text tabs, the active one underlined like the tab bar indicator.
    underlineRow: { gap: 20 },
    underlineTab: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    underlineTabActive: { borderBottomColor: c.primary },
    underlineLabelActive: { color: c.primary, fontWeight: fontWeight.semibold },
  });
