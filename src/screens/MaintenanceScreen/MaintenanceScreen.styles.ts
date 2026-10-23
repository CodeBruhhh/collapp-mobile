import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: spacing.md,
      padding: spacing.lg,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
      textAlign: 'center',
    },
    body: { fontSize: fontSize.md, color: c.textMuted, textAlign: 'center' },
  });
