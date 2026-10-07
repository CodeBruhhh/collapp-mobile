import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { gap: spacing.sm },
    tab: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    tabActive: { backgroundColor: c.text, borderColor: c.text },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },
    labelActive: { color: c.background },
  });
