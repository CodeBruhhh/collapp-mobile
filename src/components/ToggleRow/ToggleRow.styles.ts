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
    text: { flex: 1, gap: 2 },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    description: { fontSize: fontSize.sm, color: c.textMuted },
  });
