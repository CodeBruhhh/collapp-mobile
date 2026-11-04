import { StyleSheet } from 'react-native';

import { fonts, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    column: { flex: 1 },
    row: {
      height: 53,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    label: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14, color: c.textMuted },
    value: { fontFamily: fonts.regular, fontSize: 28, letterSpacing: -1, color: c.text },
  });
