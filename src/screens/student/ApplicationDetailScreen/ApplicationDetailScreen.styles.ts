import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.md },
    title: { fontSize: fontSize.lg, fontFamily: fonts.semibold, color: c.text },
    meta: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    body: { fontFamily: fonts.regular, fontSize: fontSize.md, color: c.text, lineHeight: 22 },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.text },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  });
