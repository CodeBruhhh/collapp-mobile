import { StyleSheet } from 'react-native';

import { spacing, type ThemeColors } from '@/styles';

export const PAGE_END = spacing.xl;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
  });
