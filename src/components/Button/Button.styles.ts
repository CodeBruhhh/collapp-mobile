import { StyleSheet } from 'react-native';

import {
  CONTROL_HEIGHT,
  fontSize,
  fontWeight,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    base: {
      minHeight: CONTROL_HEIGHT,
      paddingHorizontal: spacing.lg,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primary: { backgroundColor: c.primary },
    secondary: t.editorial
      ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.text }
      : { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    danger: { backgroundColor: c.danger },
    link: {
      minHeight: TOUCH_TARGET,
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.sm,
    },
    pressed: { opacity: 0.75 },
    inactive: { opacity: 0.45 },
    content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    icon: { width: 16, height: 16 },
    label: { fontSize: t.editorial ? 15 : fontSize.md, fontWeight: fontWeight.semibold },
    labelPrimary: { color: c.onPrimary },
    labelSecondary: { color: c.text },
    labelDanger: { color: '#FFFFFF' },
    labelLink: { color: c.primary },
  });
