import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: spacing.xs,
      paddingTop: rhythm.section,
      paddingHorizontal: rhythm.gutter,
    },
    // A lifted sheet band, like the chart band on Analytics.
    band: {
      marginTop: rhythm.section,
      paddingBottom: rhythm.section,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    heading: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    title: { ...type.heading, flex: 1, color: c.text },
    meta: { ...type.caption, color: c.textMuted },
    link: { ...type.caption, fontFamily: fonts.medium, color: c.primary },
  });
