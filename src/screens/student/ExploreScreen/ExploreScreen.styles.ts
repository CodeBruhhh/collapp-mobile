import { StyleSheet } from 'react-native';

import { CONTROL_HEIGHT, fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
    header: { gap: spacing.md, marginBottom: spacing.sm },
    searchBox: {
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
    searchInput: { flex: 1, minHeight: CONTROL_HEIGHT, fontSize: fontSize.md, color: c.text },
    clear: { padding: spacing.xs },
    filters: { gap: spacing.sm },
    count: { fontSize: fontSize.sm, color: c.textMuted },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    info: { flex: 1, gap: 2 },
    name: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
  });
