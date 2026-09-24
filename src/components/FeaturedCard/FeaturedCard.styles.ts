import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    image: { width: 112, alignSelf: 'stretch', minHeight: 152 },
    body: { flex: 1, gap: spacing.xs },
    eyebrow: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: c.textMuted, textTransform: 'uppercase' },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    description: { fontSize: fontSize.sm, color: c.textMuted },
    action: { alignItems: 'flex-start', marginTop: spacing.xs },
  });