import { StyleSheet } from 'react-native';

import { spacing, TOUCH_TARGET } from '@/styles';

export const createStyles = () =>
  StyleSheet.create({
    button: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginRight: spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
