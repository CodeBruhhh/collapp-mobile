import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    body: { fontSize: fontSize.sm, color: c.textMuted, textAlign: 'center' },
  });
