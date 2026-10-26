import { StyleSheet } from 'react-native';

import {
  CONTROL_HEIGHT,
  fontSize,
  fontWeight,
  radius,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
} from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: CONTROL_HEIGHT,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: c.primary },
    secondary: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    danger: { backgroundColor: c.danger },
    link: {
      minHeight: TOUCH_TARGET,
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.sm,
    },
    pressed: { opacity: 0.75 },
    inactive: { opacity: 0.45 },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    labelPrimary: { color: c.onPrimary },
    labelSecondary: { color: c.text },
    labelDanger: { color: '#FFFFFF' },
    labelLink: { color: c.primary },
  });
