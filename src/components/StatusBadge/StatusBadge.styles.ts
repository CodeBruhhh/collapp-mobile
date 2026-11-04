import { StyleSheet } from 'react-native';

import { radius, type, type ThemeColors } from '@/styles';

export const createStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderWidth: 1,
      borderRadius: radius.pill,
    },
    text: { ...type.overline, letterSpacing: 0.8 },
  });
