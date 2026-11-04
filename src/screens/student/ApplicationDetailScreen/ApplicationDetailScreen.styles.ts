import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    heading: { paddingHorizontal: rhythm.gutter, paddingTop: rhythm.gutter },
    status: { gap: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.lg },
    meta: { ...type.caption, color: c.textMuted },
    body: { ...type.body, color: c.text },
    essay: { ...type.body, paddingTop: spacing.sm, color: c.text },
    admitted: { ...type.title, fontFamily: fonts.semibold, color: c.primary },
    sectionTitle: { ...type.heading, color: c.text },
    decision: {
      gap: spacing.sm,
      marginHorizontal: rhythm.gutter,
      marginTop: rhythm.section,
      paddingTop: spacing.md,
      borderTopWidth: 2,
    },
  });
