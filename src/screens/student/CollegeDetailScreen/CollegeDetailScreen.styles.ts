import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.md },
    hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    heroText: { flex: 1, gap: 2 },
    name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
    section: { gap: spacing.sm },
    cardTitle: {
      flexShrink: 1,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    body: { fontSize: fontSize.md, color: c.text, lineHeight: 22 },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    closed: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.danger },
    required: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.text },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    footerSave: { flex: 1 },
    footerApply: { flex: 2 },
  });
