import { StyleSheet } from 'react-native';

import type { ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 3 },
    tick: { flex: 1, height: 8, backgroundColor: c.border },
    filled: { backgroundColor: c.primary },
  });
