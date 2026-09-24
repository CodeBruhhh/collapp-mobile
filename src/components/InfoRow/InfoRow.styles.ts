import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: 2 },
    label: { fontSize: fontSize.sm, color: c.textMuted },
    value: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    empty: { fontSize: fontSize.md, color: c.textMuted, fontStyle: 'italic' },
  });
