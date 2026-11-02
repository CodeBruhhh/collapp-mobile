import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: TOUCH_TARGET,
    },
    disabled: { opacity: 0.5 },
    text: { flex: 1, gap: 2 },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    description: { fontSize: fontSize.sm, color: c.textMuted },
    // Editorial: the switch sits on the label line, the description runs underneath.
    ledgerRow: {
      gap: 4,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    ledgerLabel: { flex: 1, fontSize: 15, fontWeight: fontWeight.medium, color: c.text },
    ledgerDescription: { fontSize: 13, lineHeight: 19, color: c.textMuted },
  });
