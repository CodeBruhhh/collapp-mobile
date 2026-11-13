import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter },
    eyebrow: { ...type.overline, color: c.primary },
    meta: { ...type.caption, fontSize: 12, lineHeight: 16, color: c.textMuted },
    title: {
      marginTop: 6,
      fontFamily: fonts.serif,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.8,
      color: c.text,
    },
    figures: {
      flexDirection: 'row',
      gap: rhythm.section,
      marginTop: 20,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    figure: { ...type.numeral, fontSize: 32, lineHeight: 38, color: c.primary },
    label: { ...type.caption, color: c.textMuted },
    breakdown: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    reaction: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    reactionText: { ...type.caption, color: c.text },
    heading: { ...type.heading, marginTop: spacing.lg, color: c.text },
    status: { ...type.body, paddingTop: spacing.sm, color: c.textMuted },
  });
