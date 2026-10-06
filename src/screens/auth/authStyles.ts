import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

/** Shared layout for the auth screens (SDD screens 1-3). */
export const createAuthStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: { gap: spacing.xs, marginBottom: spacing.sm },
    brand: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.primary,
      textAlign: 'center',
    },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    subtitle: { fontSize: fontSize.md, color: c.textMuted },
    centeredText: { textAlign: 'center' },
    form: { gap: spacing.md },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
    muted: { fontSize: fontSize.sm, color: c.textMuted },
    banner: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    bannerText: { fontSize: fontSize.sm, color: c.text },
    errorText: { fontSize: fontSize.sm, color: c.danger },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: TOUCH_TARGET,
    },
    checkboxLabel: { flex: 1, fontSize: fontSize.sm, color: c.text },
  });
