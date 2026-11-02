import { StyleSheet } from 'react-native';

import { createRepStyles } from '@/screens/rep/repStyles';
import { fontWeight, spacing, type ThemeColors, type ThemeTokens } from '@/styles';

/**
 * Admin console layout (SDD screens 28-31) in the "Editorial Teal" look:
 * the console styles with literary headings and ruled ledger rows.
 */
export const createAdminStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    ...createRepStyles(c),
    content: { padding: spacing.lg, gap: spacing.lg },
    /** Ledger lists: rows sit flush, the rules separate them. */
    listContent: { padding: spacing.lg, paddingBottom: spacing.xl },
    listHeader: { gap: spacing.md, paddingBottom: spacing.md },
    badges: { alignItems: 'flex-end', gap: 6 },
    heading: { gap: 10 },
    title: {
      fontFamily: t.headingFont,
      fontSize: 27,
      lineHeight: 32,
      letterSpacing: -1.1,
      color: c.text,
    },
    subtitle: { fontSize: 14, lineHeight: 21, color: c.textMuted },
    sectionTitle: {
      fontFamily: t.headingFont,
      fontSize: 19,
      lineHeight: 26,
      letterSpacing: -0.5,
      color: c.text,
    },
    cardTitle: { fontSize: 15, fontWeight: fontWeight.medium, color: c.text },
    meta: { fontSize: 13, lineHeight: 18, color: c.textMuted },
    body: { fontSize: 14, lineHeight: 21, color: c.text },
    searchBox: {
      ...createRepStyles(c).searchBox,
      borderRadius: t.radius.md,
    },
    /** Muted count above a ledger, e.g. "12 people". */
    tally: { fontSize: 12, letterSpacing: 0.4, color: c.textMuted },
    /** One ruled line of a ledger; the list's first row adds `ledgerTop`. */
    ledgerRow: {
      gap: 6,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    ledgerTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    pressed: { backgroundColor: c.surfaceMuted },
    notice: { fontSize: 13, fontWeight: fontWeight.medium, color: c.primary, textAlign: 'center' },
    dangerText: { color: c.danger },
  });
