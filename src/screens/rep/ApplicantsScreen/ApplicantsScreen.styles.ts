import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, type ThemeColors } from '@/styles';

/** The review queue's header: heading, find-and-narrow controls, views, tabs, tally. */
export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: { gap: spacing.md, paddingBottom: spacing.sm },
    controls: { gap: spacing.md - 4 },
    toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },

    views: { gap: spacing.sm },
    view: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 32,
      paddingHorizontal: spacing.md - 6,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
    },
    viewActive: { backgroundColor: c.primary },
    viewLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.text },
    viewCount: { fontFamily: fonts.semibold, fontSize: 13, color: c.textMuted },
    viewLabelActive: { color: c.onPrimary },

    seats: {
      gap: 6,
      padding: spacing.md - 4,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },

    // The active tab's underline sits on this rule, like the college page's tabs.
    tabStrip: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    resultLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    clear: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: c.primary },
    rowMeta: { flexShrink: 1 },
    more: { paddingVertical: spacing.lg },
  });
