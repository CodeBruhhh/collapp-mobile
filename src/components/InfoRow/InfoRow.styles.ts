import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: 2 },
    label: { fontSize: fontSize.sm, color: c.textMuted },
    value: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    empty: { fontSize: fontSize.md, color: c.textMuted, fontStyle: 'italic' },
    // Editorial: label and value share one ruled line; the value carries the accent.
    ledgerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    ledgerValue: {
      flexShrink: 1,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: c.primary,
      textAlign: 'right',
    },
  });
