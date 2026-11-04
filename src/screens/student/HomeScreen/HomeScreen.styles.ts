import { StyleSheet } from 'react-native';

import { CONTROL_HEIGHT, fonts, fontSize, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: spacing.xl },
    overview: { gap: 22, paddingHorizontal: rhythm.gutter, paddingTop: rhythm.gutter },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: CONTROL_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: c.text,
    },
    searchText: { fontFamily: fonts.regular, fontSize: fontSize.md, color: c.textMuted },
    totals: { flexDirection: 'row', gap: rhythm.gutter },
    pressed: { backgroundColor: c.surfaceMuted },
    featured: { gap: 12, paddingTop: rhythm.section },
    featuredTitle: { ...type.heading, paddingHorizontal: rhythm.gutter, color: c.text },
    featuredRow: { gap: 12, paddingHorizontal: rhythm.gutter },
    featuredCard: {
      width: 168,
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderTopWidth: 2,
      borderTopColor: c.primary,
    },
    cardTitle: { ...type.title, color: c.text },
    meta: { ...type.caption, color: c.textMuted },
    status: { ...type.body, paddingVertical: spacing.sm, color: c.textMuted },
  });
