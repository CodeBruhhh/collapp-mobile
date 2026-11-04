import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    flex: { flex: 1, gap: 2 },
    college: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.text },
    program: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.text },
    meta: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    score: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.primary },
    reasons: { gap: 2 },
    reason: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.text },
  });
