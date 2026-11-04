import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    form: { gap: spacing.md },
    hint: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
  });
