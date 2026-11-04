import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

/** Selection chips: a soft accent tint for chosen options, never a heavy solid block. */
export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.xs },
    label: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: c.text },
    hint: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
    chip: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
    chipText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.text },
    chipTextActive: { color: c.primary, fontFamily: fonts.semibold },
    error: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.danger },
  });
