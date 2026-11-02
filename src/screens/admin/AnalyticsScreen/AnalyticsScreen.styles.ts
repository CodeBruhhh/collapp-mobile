import { StyleSheet } from 'react-native';

import { fontWeight, spacing, TOUCH_TARGET, type ThemeColors, type ThemeTokens } from '@/styles';

/** Tallest submission bar; the plot leaves room above it for the value label. */
export const CHART_MAX_BAR = 88;
const PLOT_HEIGHT = 114;
/** "Editorial Teal" (Figma 6:1930); colors come from the admin theme. */
const GUTTER = spacing.lg;

export const createAnalyticsStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: spacing.xl },

    // Overview
    overview: { padding: GUTTER, gap: 26 },
    heading: { gap: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: {
      flex: 1,
      fontFamily: t.headingFont,
      fontSize: 27,
      lineHeight: 32,
      letterSpacing: -1.1,
      color: c.text,
    },
    iconButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginRight: -6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    subtitle: { fontSize: 14, lineHeight: 21, color: c.textMuted },
    totals: { flexDirection: 'row', gap: GUTTER },
    panel: { width: 164, height: 160, padding: 18, justifyContent: 'space-between' },
    panelShape: { position: 'absolute', top: 0, left: 0, width: 164, height: 160 },
    panelHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    panelLabel: { fontSize: 13, color: c.onPrimary },
    panelValue: { fontFamily: t.headingFont, fontSize: 64, lineHeight: 72, color: c.onPrimary },
    accountTotals: { flex: 1 },
    metric: {
      height: 53,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    metricLabel: { fontSize: 14, color: c.textMuted },
    metricValue: { fontSize: 28, letterSpacing: -1, color: c.text },

    // Shared section chrome
    section: { paddingHorizontal: GUTTER, paddingVertical: 28, gap: 18 },
    sectionTitle: {
      fontFamily: t.headingFont,
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
    totalValue: { fontFamily: t.headingFont, fontSize: 34, letterSpacing: -1, color: c.primary },
    totalMeta: { fontSize: 13, color: c.textMuted },
    chart: { gap: 9 },
    plot: { height: PLOT_HEIGHT, flexDirection: 'row', alignItems: 'flex-end' },
    guide: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: c.border },
    upperGuide: { top: PLOT_HEIGHT - CHART_MAX_BAR - 8 },
    baseline: { bottom: 0 },
    barColumn: { flex: 1, alignItems: 'center', gap: 6 },
    barValue: { fontSize: 11, color: c.textMuted },
    barValueActive: { fontWeight: fontWeight.semibold, color: c.primary },
    bar: { width: 23, height: 2, backgroundColor: c.border },
    barActive: { backgroundColor: c.primary },
    weekLabels: { flexDirection: 'row' },
    weekLabel: { flex: 1, fontSize: 10, textAlign: 'center', color: c.textMuted },
    weekLabelActive: { color: c.primary },

    // Applications by status
    statusRow: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 14 },
    statusIcon: { width: 16, height: 16 },
    statusLabel: { flex: 1, fontSize: 14, color: c.text },
    statusLabelAccent: { fontWeight: fontWeight.semibold, color: c.primary },
    statusCount: { fontSize: 16, color: c.textMuted },
    countActive: { fontWeight: fontWeight.medium, color: c.primary },

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
    opLabel: { fontSize: 14, lineHeight: 20, color: c.text },
    opHint: { fontSize: 12, color: c.textMuted },
    opValue: { fontSize: 22, fontWeight: fontWeight.medium, color: c.text },
    pressed: { opacity: 0.6 },

    // Platform controls
    setting: { paddingVertical: 20, gap: 10 },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: fontWeight.medium, color: c.text },
    settingState: {
      fontSize: 10,
      fontWeight: fontWeight.semibold,
      letterSpacing: 0.6,
      color: c.textMuted,
    },
    settingStateOn: { color: c.primary },
    settingHint: { fontSize: 13, lineHeight: 19, color: c.textMuted },
    footnote: { fontSize: 12, lineHeight: 19, color: c.textMuted },
  });
