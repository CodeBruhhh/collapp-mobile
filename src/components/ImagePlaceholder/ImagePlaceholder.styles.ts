import { StyleSheet } from 'react-native';

import { radius, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    box: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.border,
      borderRadius: radius.md,
    },
  });