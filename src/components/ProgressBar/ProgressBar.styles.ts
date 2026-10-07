import { StyleSheet } from 'react-native';

import { radius, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    track: { height: 6, borderRadius: radius.sm, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: '100%' },
  });
