import { StyleSheet } from 'react-native';

import { rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, paddingBottom: spacing.xl, flexGrow: 1 },
    header: { gap: spacing.md, marginBottom: spacing.md },
    filters: { gap: spacing.sm },
    count: { ...type.caption, color: c.textMuted },
    deadline: { paddingTop: spacing.xs },
  });
