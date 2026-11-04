import { StyleSheet } from 'react-native';

import { rhythm, spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, paddingTop: spacing.sm, flexGrow: 1 },
    header: { marginBottom: spacing.xs },
    headerActions: { flexDirection: 'row' },
    headerButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonDisabled: { opacity: 0.35 },
    day: {
      ...type.overline,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
      color: c.textMuted,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    iconUnread: { backgroundColor: c.primarySoft },
    side: { alignItems: 'flex-end', gap: spacing.sm },
    time: { ...type.caption, fontSize: 12, color: c.textMuted },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary },
  });
