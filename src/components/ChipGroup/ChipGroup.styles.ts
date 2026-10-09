import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.xs },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },
    hint: { fontSize: fontSize.sm, color: c.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    chip: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: fontSize.sm, color: c.text },
    chipTextActive: { color: c.onPrimary, fontWeight: fontWeight.semibold },
    error: { fontSize: fontSize.sm, color: c.danger },
  });
