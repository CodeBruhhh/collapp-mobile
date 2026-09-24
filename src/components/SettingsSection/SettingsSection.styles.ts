import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    title: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
  });
