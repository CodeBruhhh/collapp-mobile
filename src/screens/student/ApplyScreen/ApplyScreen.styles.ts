import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.md },
    flex: { flex: 1 },
    stepper: { flexDirection: 'row', gap: spacing.sm },
    stepItem: { flex: 1, gap: spacing.xs },
    stepBar: { height: 4, borderRadius: radius.sm, backgroundColor: c.border },
    stepBarActive: { backgroundColor: c.primary },
    stepLabel: { fontSize: fontSize.xs, color: c.textMuted },
    stepLabelActive: { color: c.text, fontWeight: fontWeight.semibold },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    subtitle: { fontSize: fontSize.sm, color: c.textMuted },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
    note: { fontSize: fontSize.sm, color: c.status.actionRequired },
    reqHeader: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    reqText: { flex: 1, gap: 2 },
    reqLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    reqActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
    summaryLabel: { fontSize: fontSize.sm, color: c.textMuted },
    summaryValue: {
      flexShrink: 1,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: c.text,
      textAlign: 'right',
    },
    warning: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.status.actionRequired,
      backgroundColor: c.surface,
    },
    warningText: { fontSize: fontSize.sm, color: c.text },
    footer: {
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    footerRow: { flexDirection: 'row', gap: spacing.sm },
  });
