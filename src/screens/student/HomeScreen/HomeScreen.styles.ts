import { StyleSheet } from 'react-native';

import { CONTROL_HEIGHT, fonts, fontSize, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    // Wider gaps between sections than inside them, so each group reads as one block.
    content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.lg },
    flex: { flex: 1 },
    greeting: { fontSize: fontSize.xl, fontFamily: fonts.semibold, color: c.text },
    meta: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: CONTROL_HEIGHT,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    searchText: { fontFamily: fonts.regular, fontSize: fontSize.md, color: c.textMuted },
    stats: { flexDirection: 'row', gap: spacing.sm },
    stat: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    statValue: { fontSize: fontSize.xl, fontFamily: fonts.semibold, color: c.text },
    statLabel: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: c.textMuted },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.lg, fontFamily: fonts.semibold, color: c.text },
    cardTitle: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    featuredRow: { gap: spacing.sm, paddingRight: spacing.md },
    featuredCard: {
      width: 176,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    link: {
      fontSize: fontSize.sm,
      fontFamily: fonts.semibold,
      color: c.primary,
      padding: spacing.sm,
    },
  });
