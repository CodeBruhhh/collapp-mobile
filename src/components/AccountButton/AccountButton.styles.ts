import { StyleSheet } from 'react-native';

import { spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginRight: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    glyph: { width: 17, height: 17 },
    pressed: { opacity: 0.6 },
  });
