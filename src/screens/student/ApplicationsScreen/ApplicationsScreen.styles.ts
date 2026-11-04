import { StyleSheet } from 'react-native';

import { rhythm, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, paddingBottom: spacing.xl, flexGrow: 1 },
    header: { gap: 18, marginBottom: spacing.sm },
    totals: { flexDirection: 'row', gap: rhythm.gutter },
    progress: { gap: spacing.sm, paddingTop: spacing.sm },
    statusLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  });
