import { StyleSheet } from 'react-native';

import { fonts, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    link: { minHeight: TOUCH_TARGET, justifyContent: 'center', paddingLeft: spacing.sm },
    accent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
      marginRight: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: c.onPrimary,
      borderRadius: radius.md,
    },
    accentFollowing: { backgroundColor: c.onPrimary },
    label: { fontFamily: fonts.semibold, fontSize: 13, color: c.primary },
    labelMuted: { color: c.textMuted },
    labelOnAccent: { color: c.onPrimary },
    labelFollowing: { color: c.primary },
  });
