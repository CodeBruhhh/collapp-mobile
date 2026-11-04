import { StyleSheet } from 'react-native';

import { spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    ruled: {
      gap: 4,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: TOUCH_TARGET,
    },
    disabled: { opacity: 0.5 },
    label: { ...type.title, flex: 1, color: c.text },
    description: { ...type.caption, lineHeight: 19, color: c.textMuted },
  });
