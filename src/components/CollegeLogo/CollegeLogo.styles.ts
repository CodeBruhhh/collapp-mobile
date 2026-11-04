import { StyleSheet } from 'react-native';

import { fonts, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    image: { backgroundColor: c.border },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    initials: { color: c.onPrimary, fontFamily: fonts.semibold },
  });
