import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: spacing.sm },
    chip: {
      minHeight: TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipSelected: { backgroundColor: c.primary, borderColor: c.primary },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },
    labelSelected: { color: c.onPrimary },
  });
