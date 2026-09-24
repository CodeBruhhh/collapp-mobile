import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      minHeight: TOUCH_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    disabled: { opacity: 0.5 },
    text: { flex: 1, gap: 2 },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    description: { fontSize: fontSize.sm, color: c.textMuted },
  });
