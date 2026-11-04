import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
    header: { gap: spacing.md, marginBottom: spacing.sm },
    clear: { padding: spacing.xs },
    filters: { gap: spacing.sm },
    count: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    info: { flex: 1, gap: 2 },
    name: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.text },
    meta: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
  });
