import { StyleSheet } from 'react-native';

import { fonts, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: TOUCH_TARGET,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    pressed: { opacity: 0.6 },
    inactive: { opacity: 0.45 },
    label: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: c.primary },
  });
