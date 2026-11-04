import { StyleSheet } from 'react-native';

import { fonts, spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderBottomWidth: 1,
    },
    pressed: { backgroundColor: c.surfaceMuted },
    text: { flex: 1, gap: 2 },
    title: { ...type.label, color: c.text },
    message: { ...type.caption, fontSize: 12, color: c.textMuted },
    action: { minHeight: TOUCH_TARGET, justifyContent: 'center', paddingHorizontal: spacing.sm },
    actionText: { fontFamily: fonts.semibold, fontSize: 13 },
  });
