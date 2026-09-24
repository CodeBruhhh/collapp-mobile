import { StyleSheet } from 'react-native';

import type { ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    track: {
      height: 8,
      borderRadius: 4,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    fill: { height: '100%', borderRadius: 4 },
  });
