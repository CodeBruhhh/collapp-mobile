import { StyleSheet } from 'react-native';

import { fontSize, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hint: { fontSize: fontSize.sm, color: c.textMuted },
  });
