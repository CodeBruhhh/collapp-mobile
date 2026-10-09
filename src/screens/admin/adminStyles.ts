import { StyleSheet } from 'react-native';

import { createRepStyles } from '@/screens/rep/repStyles';
import { fontSize, radius, spacing, type ThemeColors } from '@/styles';

const CHART_HEIGHT = 120;

/** Admin console layout (SDD screens 27-31): the console styles plus chart and list rows. */
export const createAdminStyles = (c: ThemeColors) =>
  StyleSheet.create({
    ...createRepStyles(c),
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      height: CHART_HEIGHT + 36,
    },
    barColumn: { flex: 1, alignItems: 'center', gap: 4 },
    barValue: { fontSize: fontSize.xs, color: c.textMuted },
    bar: {
      width: '70%',
      minHeight: 2,
      borderTopLeftRadius: radius.sm,
      borderTopRightRadius: radius.sm,
      backgroundColor: c.primary,
    },
    barLabel: { fontSize: 10, color: c.textMuted },
    dangerText: { color: c.danger },
  });

export const CHART_MAX_BAR = CHART_HEIGHT;
