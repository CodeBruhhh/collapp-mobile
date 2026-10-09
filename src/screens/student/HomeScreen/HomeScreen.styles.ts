import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.md },
    flex: { flex: 1 },
    greeting: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
    search: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    searchText: { fontSize: fontSize.md, color: c.textMuted },
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
    statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    statLabel: { fontSize: fontSize.xs, color: c.textMuted },
    section: { gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: c.text },
    cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    featuredRow: { gap: spacing.sm, paddingRight: spacing.md },
    featuredCard: {
      width: 200,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    link: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.primary,
      padding: spacing.sm,
    },
  });
