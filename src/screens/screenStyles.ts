import { StyleSheet } from 'react-native';

import {
  fonts,
  fontSize,
  radius,
  rhythm,
  spacing,
  TOUCH_TARGET,
  type,
  type ThemeColors,
} from '@/styles';

/**
 * Shared layout for the representative and admin screens (SDD screens 19-31):
 * literary headings, ruled ledger rows and the console's common pieces.
 */
export const createScreenStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, gap: spacing.lg },
    flex: { flex: 1 },
    title: { ...type.display, color: c.text },
    pageName: { ...type.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.8, color: c.text },
    subtitle: { ...type.body, color: c.textMuted },
    section: { gap: spacing.sm },
    sectionTitle: { ...type.heading, color: c.text },
    cardTitle: { ...type.title, color: c.text },
    body: { ...type.body, color: c.text },
    meta: { ...type.caption, color: c.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    action: { flexGrow: 1, flexBasis: '45%' },
    docPreview: {
      height: 180,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    docPreviewImage: { width: '100%', height: '100%' },
    postImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
    headerIcon: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBlock: { gap: spacing.sm },
    reason: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    footerHint: {
      fontFamily: fonts.regular,
      fontSize: fontSize.xs,
      color: c.textMuted,
      textAlign: 'center',
    },
    heading: { gap: 10 },
    /** Full-width pages: sections bring their own gutter. */
    page: { paddingBottom: spacing.xl },
    overview: { gap: 22, padding: rhythm.gutter, paddingBottom: 0 },
    totals: { flexDirection: 'row', gap: rhythm.gutter },
    form: { gap: 18, paddingTop: spacing.sm },
    /** A destructive link at the end of a form. */
    endLink: { alignItems: 'center' },
    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    metaLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    fit: { gap: 6, paddingTop: spacing.sm },
    fitValue: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 52, color: c.primary },
    decision: {
      gap: spacing.sm,
      marginHorizontal: rhythm.gutter,
      marginTop: rhythm.section,
      paddingTop: spacing.md,
      borderTopWidth: 2,
    },
    block: { gap: 2, paddingTop: 14 },
    document: {
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    stickyColumn: { flex: 1, gap: spacing.sm },
    /** Ledger lists: rows sit flush, the rules separate them. */
    listContent: { padding: rhythm.gutter, paddingBottom: spacing.xl },
    listHeader: { gap: spacing.md, paddingBottom: spacing.md },
    badges: { alignItems: 'flex-end', gap: 6 },
    /** Muted count above a ledger, e.g. "12 people". */
    tally: { ...type.caption, fontSize: 12, letterSpacing: 0.4, color: c.textMuted },
    /** One ruled line of a ledger; the list's first row adds `ledgerTop`. */
    ledgerRow: {
      gap: 6,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    ledgerTop: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    pressed: { backgroundColor: c.surfaceMuted },
    notice: { ...type.caption, fontFamily: fonts.medium, color: c.primary, textAlign: 'center' },
    dangerText: { color: c.danger },
  });
