import { StyleSheet } from 'react-native';

import { fontSize, spacing, type ThemeColors } from '@/styles';

/** Shared by the Profile & Settings screens of every role (SDD 18). */
export const createAccountStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hint: { fontSize: fontSize.sm, color: c.textMuted },
    form: { gap: spacing.md },
  });
