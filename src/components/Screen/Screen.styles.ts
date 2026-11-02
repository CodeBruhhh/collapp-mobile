import { StyleSheet } from 'react-native';

import { spacing, type ThemeColors, type ThemeTokens } from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: t.editorial
      ? { paddingBottom: spacing.xl }
      : { padding: spacing.md, paddingBottom: spacing.md, gap: spacing.md },
  });
