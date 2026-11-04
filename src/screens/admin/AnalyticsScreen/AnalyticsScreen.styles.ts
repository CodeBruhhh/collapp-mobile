import { StyleSheet } from 'react-native';

import { fonts, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

/** "Editorial Teal" (Figma 6:1930); colors come from the admin theme. */
const GUTTER = spacing.lg;

export const createAnalyticsStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: spacing.xl },

    // Overview
    overview: { padding: GUTTER, gap: 26 },
    iconButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginRight: -6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    totals: { flexDirection: 'row', gap: GUTTER },

    // Shared section chrome
    section: { paddingHorizontal: GUTTER, paddingVertical: 28, gap: 18 },
    sectionTitle: {
      fontFamily: fonts.serif,
      fontSize: 19,
      lineHeight: 26,
      letterSpacing: -0.5,
      color: c.text,
    },
    ledger: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    ruled: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },

    // Weekly submissions
    sheet: {
      paddingVertical: 26,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    total: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    totalValue: { fontFamily: fonts.serif, fontSize: 34, letterSpacing: -1, color: c.primary },
    totalMeta: { fontFamily: fonts.regular, fontSize: 13, color: c.textMuted },

    // Applications by status
    statusRow: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 14 },
    statusLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: c.text },
    statusLabelAccent: { fontFamily: fonts.semibold, color: c.primary },
    statusCount: { fontFamily: fonts.regular, fontSize: 16, color: c.textMuted },
    countActive: { fontFamily: fonts.medium, color: c.primary },

    // Operations
    flush: { paddingTop: 0, gap: 16 },
    opRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingVertical: 10,
    },
    opText: { flex: 1, gap: 4 },
    opLabel: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.text },
    opHint: { fontFamily: fonts.regular, fontSize: 12, color: c.textMuted },
    opValue: { fontSize: 22, fontFamily: fonts.medium, color: c.text },
    pressed: { opacity: 0.6 },

    // Platform controls
    setting: { paddingVertical: 20, gap: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    settingLabel: { flex: 1, fontSize: 15, fontFamily: fonts.medium, color: c.text },
    settingState: {
      fontSize: 10,
      fontFamily: fonts.semibold,
      letterSpacing: 0.6,
      color: c.textMuted,
    },
    settingStateOn: { color: c.primary },
    settingHint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.textMuted },
    footnote: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, color: c.textMuted },
  });
