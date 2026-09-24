import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    description: {
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardHeading: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
      textTransform: 'uppercase',
    },
    feature: {
      fontSize: fontSize.md,
      color: c.text,
    },
  });
