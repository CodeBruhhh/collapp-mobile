import { StyleSheet } from 'react-native';

import { fonts, fontSize, rhythm, spacing, type ThemeColors } from '@/styles';

/** Shared by the Profile & Settings screens of every role (SDD 18). */
export const createAccountStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hint: {
      paddingTop: 14,
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 18,
      color: c.textMuted,
    },
    form: { gap: spacing.md },
    title: { fontSize: fontSize.lg, fontFamily: fonts.semibold, color: c.text },
    body: { fontFamily: fonts.regular, fontSize: fontSize.md, color: c.text },
    danger: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.danger },
    signOut: { paddingTop: spacing.lg, paddingHorizontal: rhythm.gutter },
  });
