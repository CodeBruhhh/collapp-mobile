import { StyleSheet } from 'react-native';

import { TOUCH_TARGET } from '@/styles';

export const createStyles = () =>
  StyleSheet.create({
    button: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });