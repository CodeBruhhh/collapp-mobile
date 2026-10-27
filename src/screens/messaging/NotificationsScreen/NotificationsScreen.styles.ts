import { StyleSheet } from 'react-native';

import {
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
} from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
    header: { marginBottom: spacing.sm },
    headerActions: { flexDirection: 'row' },
    headerButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonDisabled: { opacity: 0.35 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    iconUnread: { backgroundColor: c.primarySoft },
    info: { flex: 1, gap: 2 },
    topLine: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
    title: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: c.text },
    unreadTitle: { fontWeight: fontWeight.semibold },
    body: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: c.textMuted },
    time: { fontSize: fontSize.xs, color: c.textMuted },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary },
  });
