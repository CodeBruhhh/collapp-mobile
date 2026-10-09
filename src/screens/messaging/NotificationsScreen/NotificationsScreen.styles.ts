import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
    header: { gap: spacing.sm, marginBottom: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
    },
    info: { flex: 1, gap: 2 },
    topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    unreadTitle: { fontWeight: fontWeight.bold },
    body: { fontSize: fontSize.sm, color: c.textMuted },
    time: { flex: 1, fontSize: fontSize.xs, color: c.textMuted },
    delete: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginVertical: -spacing.sm,
      marginRight: -spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
    unreadCard: { borderColor: c.primary },
  });
