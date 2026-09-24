import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: TOUCH_TARGET,
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
    pressed: { opacity: 0.8 },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
    labelPrimary: { color: c.onPrimary },
    labelSecondary: { color: c.text },
  });
