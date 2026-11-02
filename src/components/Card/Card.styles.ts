import { StyleSheet } from 'react-native';

import { spacing, type ThemeColors, type ThemeTokens } from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    card: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: t.radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    // A tint (not transparency) so pressed cards never look disabled.
    pressed: { backgroundColor: c.surfaceMuted },
  });
