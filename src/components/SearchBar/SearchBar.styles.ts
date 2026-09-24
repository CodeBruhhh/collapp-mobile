import { StyleSheet } from 'react-native';

import { fontSize, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      minHeight: TOUCH_TARGET,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
    },
    input: { flex: 1, minHeight: TOUCH_TARGET, fontSize: fontSize.md, color: c.text },
  });
