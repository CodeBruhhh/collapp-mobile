import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    flex: { flex: 1, gap: 2 },
    college: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    program: { fontSize: fontSize.sm, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
    score: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.primary },
    reasons: { gap: 2 },
    reason: { fontSize: fontSize.sm, color: c.text },
  });
