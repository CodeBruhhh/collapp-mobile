import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
    text: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  });
