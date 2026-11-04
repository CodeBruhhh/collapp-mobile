import { StyleSheet } from 'react-native';

import { rhythm, type ThemeColors } from '@/styles';

export const createStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    form: { gap: rhythm.gutter },
    action: { flex: 1 },
  });
