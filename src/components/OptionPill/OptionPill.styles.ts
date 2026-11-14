import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      gap: 6,
      minHeight: 36,
      paddingHorizontal: spacing.md - 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    pillActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    pressed: { opacity: 0.7 },
    disabled: { opacity: 0.5 },
    label: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    value: { flexShrink: 1, fontFamily: fonts.semibold, fontSize: fontSize.sm, color: c.text },
    textActive: { color: c.primary },
  });
