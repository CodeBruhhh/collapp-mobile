import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.xs },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: TOUCH_TARGET,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surface,
    },
    inputRowError: { borderColor: c.danger },
    input: {
      flex: 1,
      minHeight: TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      fontSize: fontSize.md,
      color: c.text,
    },
    reveal: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: { fontSize: fontSize.sm, color: c.danger },
    hint: { fontSize: fontSize.sm, color: c.textMuted },
  });
