import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: c.background,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    actions: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
  });
