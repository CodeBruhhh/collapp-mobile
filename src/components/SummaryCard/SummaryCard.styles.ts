import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexGrow: 1,
      flexBasis: '45%',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.xs,
    },
    value: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    label: { fontSize: fontSize.sm, color: c.textMuted },
  });
