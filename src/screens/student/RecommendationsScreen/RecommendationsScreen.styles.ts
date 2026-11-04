import { StyleSheet } from 'react-native';

import { fonts, fontSize, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: spacing.md, gap: spacing.sm },
    header: { gap: spacing.sm, marginBottom: spacing.xs },
    subtitle: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    meta: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: c.textMuted },
  });
