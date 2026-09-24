import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    header: { gap: spacing.sm },
    titles: { gap: 2 },
    college: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.text },
    program: { fontSize: fontSize.sm, color: c.textMuted },
    meta: { fontSize: fontSize.sm, color: c.textMuted },
  });
