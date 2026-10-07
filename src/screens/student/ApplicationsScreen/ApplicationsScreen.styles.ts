import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm },
    header: { gap: spacing.sm, marginBottom: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    info: { flex: 1, gap: 2 },
    title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
  });
