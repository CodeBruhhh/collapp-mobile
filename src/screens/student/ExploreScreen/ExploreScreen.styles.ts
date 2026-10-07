import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm },
    header: { gap: spacing.sm, marginBottom: spacing.xs },
    searchBox: {
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
    searchInput: { flex: 1, minHeight: TOUCH_TARGET, fontSize: fontSize.md, color: c.text },
    count: { fontSize: fontSize.sm, color: c.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    info: { flex: 1, gap: 2 },
    name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
  });
