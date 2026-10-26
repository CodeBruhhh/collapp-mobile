import { StyleSheet } from 'react-native';

import { radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    // A tint (not transparency) so pressed cards never look disabled.
    pressed: { backgroundColor: c.surfaceMuted },
  });
