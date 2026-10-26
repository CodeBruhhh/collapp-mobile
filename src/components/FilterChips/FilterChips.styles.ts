import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: spacing.sm },
    chip: {
      minHeight: TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipSelected: { backgroundColor: c.primarySoft, borderColor: c.primary },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },
    labelSelected: { color: c.primary, fontWeight: fontWeight.semibold },
  });
