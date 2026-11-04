import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    label: {
      maxWidth: '45%',
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: c.textMuted,
    },
    value: {
      flex: 1,
      fontSize: fontSize.sm,
      fontFamily: fonts.medium,
      color: c.primary,
      textAlign: 'right',
    },
    empty: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'right',
    },
  });
