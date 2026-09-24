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
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    name: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.text },
    match: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.primary },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    location: { fontSize: fontSize.sm, color: c.textMuted },
    description: { fontSize: fontSize.sm, color: c.text },
    programs: { fontSize: fontSize.xs, color: c.textMuted },
  });
