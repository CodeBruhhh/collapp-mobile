import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

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
    loss: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    lossText: { ...type.body, flex: 1, color: c.text },
    signOut: { paddingTop: spacing.lg, paddingHorizontal: rhythm.gutter },
  });
