import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, paddingBottom: spacing.xl, flexGrow: 1 },
    header: { gap: spacing.md, marginBottom: spacing.md },
    side: { alignItems: 'flex-end', gap: spacing.xs },
    time: { ...type.caption, fontSize: 12, color: c.textMuted },
    badge: {
      minWidth: 20,
      height: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    badgeText: { fontFamily: fonts.semibold, fontSize: 11, color: c.onPrimary },
  });
