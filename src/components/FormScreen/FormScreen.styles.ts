import { StyleSheet } from 'react-native';

import { spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    content: { flexGrow: 1, padding: spacing.lg, gap: spacing.md },
    centered: { justifyContent: 'center' },
  });
