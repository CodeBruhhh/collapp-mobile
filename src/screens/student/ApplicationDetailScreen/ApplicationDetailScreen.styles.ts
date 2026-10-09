import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.md },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
    body: { fontSize: fontSize.md, color: c.text, lineHeight: 22 },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  });
