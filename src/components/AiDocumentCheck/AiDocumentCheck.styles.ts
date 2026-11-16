import { StyleSheet } from 'react-native';

import { fonts, radius, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    panel: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderLeftWidth: 3,
      backgroundColor: c.surfaceMuted,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headerText: { flex: 1, gap: 2 },
    verdict: { ...type.label },
    detected: { ...type.caption, color: c.textMuted },
    issue: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    issueText: { ...type.caption, flex: 1, color: c.text },
    summary: { ...type.caption, color: c.text },
    details: { gap: 4 },
    detail: { flexDirection: 'row', gap: spacing.sm },
    detailLabel: { ...type.caption, color: c.textMuted, width: 110 },
    detailValue: { ...type.caption, flex: 1, color: c.text },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    stack: { gap: spacing.sm },
    bullet: { marginTop: 5 },
    disclaimer: { ...type.caption, fontSize: 11, color: c.textMuted, flex: 1 },
    links: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    link: { fontFamily: fonts.semibold, fontSize: 13, color: c.primary },
    muted: { ...type.caption, color: c.textMuted, flex: 1 },
  });
