import { StyleSheet } from 'react-native';

import { fonts, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    pressed: { backgroundColor: c.surfaceMuted },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    flex: { flex: 1, gap: 2 },
    rank: { ...type.overline, color: c.primary },
    program: { ...type.title, color: c.text },
    college: { ...type.caption, color: c.text },
    meta: { ...type.caption, fontSize: 12, color: c.textMuted },
    score: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: c.primary },
    reasons: { gap: spacing.xs },
    reason: { flexDirection: 'row', gap: spacing.sm },
    reasonText: { ...type.caption, flex: 1, color: c.text },
  });
