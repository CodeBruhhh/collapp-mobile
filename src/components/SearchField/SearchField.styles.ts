import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.text,
    },
    input: {
      flex: 1,
      minHeight: TOUCH_TARGET + 4,
      fontFamily: fonts.regular,
      fontSize: fontSize.md,
      color: c.text,
    },
    clear: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginRight: -13,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
