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
    image: { width: 88, height: 88 },
    body: { flex: 1, gap: spacing.xs },
    name: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.text },
    description: { fontSize: fontSize.sm, color: c.textMuted },
    stats: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs },
    stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    statText: { fontSize: fontSize.xs, color: c.textMuted },
  });