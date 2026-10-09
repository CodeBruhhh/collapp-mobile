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
    pressed: { opacity: 0.85 },
  });
