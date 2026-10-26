import { StyleSheet } from 'react-native';

import { radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    block: { backgroundColor: c.surfaceMuted },
    list: { gap: spacing.sm },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    lines: { flex: 1, gap: spacing.sm },
    chat: { gap: spacing.md, padding: spacing.md },
    mine: { alignItems: 'flex-end' },
    detail: { gap: spacing.md, padding: spacing.md },
    block2: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
  });
