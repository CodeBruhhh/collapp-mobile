import { StyleSheet } from 'react-native';

import {
  CONTROL_HEIGHT,
  fonts,
  fontSize,
  radius,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
} from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.xs },
    label: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: c.text },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: CONTROL_HEIGHT,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surface,
    },
    inputRowFocused: { borderColor: c.primary },
    inputRowError: { borderColor: c.danger },
    input: {
      flex: 1,
      minHeight: CONTROL_HEIGHT,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: fonts.regular,
      fontSize: fontSize.md,
      color: c.text,
    },
    multiline: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: 'top' },
    reveal: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    error: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.danger },
    hint: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
  });
