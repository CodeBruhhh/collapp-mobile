import { StyleSheet } from 'react-native';

import { fontWeight, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    button: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: 6,
      right: 4,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.danger,
    },
    badgeText: { fontSize: 11, fontWeight: fontWeight.bold, color: '#FFFFFF' },
  });
