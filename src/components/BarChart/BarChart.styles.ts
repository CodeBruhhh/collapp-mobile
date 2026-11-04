import { StyleSheet } from 'react-native';

import { fonts, type ThemeColors } from '@/styles';

/** Tallest bar; the plot leaves room above it for the value label. */
export const CHART_MAX_BAR = 88;
const PLOT_HEIGHT = 114;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    chart: { gap: 9 },
    plot: { height: PLOT_HEIGHT, flexDirection: 'row', alignItems: 'flex-end' },
    guide: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: c.border },
    upperGuide: { top: PLOT_HEIGHT - CHART_MAX_BAR - 8 },
    baseline: { bottom: 0 },
    column: { flex: 1, alignItems: 'center', gap: 6 },
    value: { fontFamily: fonts.regular, fontSize: 11, color: c.textMuted },
    valueActive: { fontFamily: fonts.semibold, color: c.primary },
    bar: { width: 23, height: 2, backgroundColor: c.border },
    barActive: { backgroundColor: c.primary },
    labels: { flexDirection: 'row' },
    label: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 10,
      textAlign: 'center',
      color: c.textMuted,
    },
    labelActive: { color: c.primary },
  });
