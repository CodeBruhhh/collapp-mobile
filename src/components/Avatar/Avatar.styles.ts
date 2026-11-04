import { StyleSheet } from 'react-native';

import { fonts, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    image: { backgroundColor: c.border },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    fallbackOnAccent: { backgroundColor: c.onPrimary },
    initials: { fontFamily: fonts.semibold, letterSpacing: 0.5, color: c.primary },
  });
