import { StyleSheet } from 'react-native';

import { rhythm, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    block: { backgroundColor: c.surfaceMuted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    lines: { flex: 1, gap: spacing.sm },
    chat: { gap: spacing.md, padding: spacing.md },
    mine: { alignItems: 'flex-end' },
    detail: { gap: rhythm.section, padding: rhythm.gutter },
    block2: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
  });
