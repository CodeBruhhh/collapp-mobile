import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    action: {
      minHeight: TOUCH_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    actionLabel: { fontSize: fontSize.sm, color: c.textMuted },
  });