import { StyleSheet } from 'react-native';

import { CONTROL_HEIGHT, fonts, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

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
    secondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.text },
    danger: { backgroundColor: c.danger },
    link: {
      minHeight: TOUCH_TARGET,
      backgroundColor: 'transparent',
      paddingHorizontal: spacing.sm,
    },
    pressed: { opacity: 0.75 },
    inactive: { opacity: 0.45 },
    content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    label: { fontSize: 15, fontFamily: fonts.semibold },
    labelPrimary: { color: c.onPrimary },
    labelSecondary: { color: c.text },
    labelDanger: { color: '#FFFFFF' },
    labelLink: { color: c.primary },
  });
