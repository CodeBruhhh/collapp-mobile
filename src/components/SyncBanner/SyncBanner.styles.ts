import { StyleSheet } from 'react-native';

import {
  fontSize,
  fontWeight,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: c.status.submitted,
      backgroundColor: c.surface,
    },
    text: { flex: 1, fontSize: fontSize.sm, color: c.text },
    action: { minHeight: TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.sm },
    actionText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.primary },
  });
