import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, gap: spacing.md, padding: spacing.md, backgroundColor: c.background },
    flex: { flex: 1 },
    title: { fontSize: fontSize.lg, fontFamily: fonts.semibold, color: c.text },
    image: { flex: 1, borderRadius: radius.md, backgroundColor: c.surface },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    meta: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    actions: { flexDirection: 'row', gap: spacing.sm },
  });
