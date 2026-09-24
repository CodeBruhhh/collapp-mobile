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
      gap: spacing.sm,
    },
    typeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
    type: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.primary },
    title: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.text },
    body: { fontSize: fontSize.sm, color: c.text },
    meta: { fontSize: fontSize.xs, color: c.textMuted },
  });
