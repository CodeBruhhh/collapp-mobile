import { StyleSheet } from 'react-native';

import { CONTROL_HEIGHT, fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.sm, paddingHorizontal: rhythm.gutter },
    summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    reactions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    summaryText: { ...type.caption, marginLeft: spacing.xs, color: c.textMuted },
    actions: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    disabled: { opacity: 0.45 },
    action: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: CONTROL_HEIGHT,
    },
    actionText: { fontFamily: fonts.medium, fontSize: 13, color: c.textMuted },
    actionTextActive: { fontFamily: fonts.semibold, color: c.primary },
  });
