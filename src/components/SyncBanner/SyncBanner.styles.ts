import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.status.submitted,
      backgroundColor: c.surface,
    },
    text: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.text },
    action: { minHeight: TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.sm },
    actionText: { fontSize: fontSize.sm, fontFamily: fonts.semibold, color: c.primary },
  });
