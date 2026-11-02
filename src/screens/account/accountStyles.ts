import { StyleSheet } from 'react-native';

import { editorialSpace, fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

/** Shared by the Profile & Settings screens of every role (SDD 18). */
export const createAccountStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hint: { fontSize: fontSize.sm, color: c.textMuted },
    form: { gap: spacing.md },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    body: { fontSize: fontSize.md, color: c.text },
    danger: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.danger },
    // Editorial: a footnote under a ledger, and the closing sign-out on the page.
    ledgerHint: { paddingTop: 14, fontSize: 12, lineHeight: 18, color: c.textMuted },
    signOut: { paddingTop: spacing.lg, paddingHorizontal: editorialSpace.gutter },
  });
