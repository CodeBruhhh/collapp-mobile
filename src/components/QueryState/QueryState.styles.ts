import { StyleSheet } from 'react-native';

import { fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    center: { alignItems: 'center', gap: spacing.md, padding: spacing.lg },
    error: { fontSize: fontSize.md, color: c.danger, textAlign: 'center' },
  });
