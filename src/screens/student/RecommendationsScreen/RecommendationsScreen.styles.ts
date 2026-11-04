import { StyleSheet } from 'react-native';

import { rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, flexGrow: 1 },
    header: { gap: 12, marginBottom: spacing.xs },
    subtitle: { ...type.body, color: c.textMuted },
    meta: { ...type.caption, fontSize: 12, color: c.textMuted },
    footer: { paddingTop: rhythm.gutter },
  });
