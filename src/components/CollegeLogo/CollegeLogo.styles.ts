import { StyleSheet } from 'react-native';

import { fontWeight, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    image: { backgroundColor: c.border },
    fallback: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    initials: { color: c.onPrimary, fontWeight: fontWeight.bold },
  });
