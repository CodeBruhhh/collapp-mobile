import { StyleSheet } from 'react-native';

import { fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    form: { gap: spacing.md },
    hint: { fontSize: fontSize.sm, color: c.textMuted },
  });
