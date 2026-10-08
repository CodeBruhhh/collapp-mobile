import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
    header: { gap: spacing.sm, marginBottom: spacing.xs },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    info: { flex: 1, gap: 2 },
    topLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    title: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    unreadTitle: { fontWeight: fontWeight.bold },
    time: { fontSize: fontSize.xs, color: c.textMuted },
    preview: { flex: 1, fontSize: fontSize.sm, color: c.textMuted },
    unreadPreview: { color: c.text, fontWeight: fontWeight.medium },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
    badge: {
      minWidth: 22,
      height: 22,
      paddingHorizontal: 6,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    badgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: c.onPrimary },
    adminAvatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.border,
    },
  });
