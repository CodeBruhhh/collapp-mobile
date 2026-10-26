import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

/** Neutral pills: the dark fill marks the active filter without competing with the accent. */
export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: spacing.sm },
    tab: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    tabActive: { backgroundColor: c.text, borderColor: c.text },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.textMuted },
    labelActive: { color: c.surface, fontWeight: fontWeight.semibold },
  });
