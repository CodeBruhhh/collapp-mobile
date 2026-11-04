import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

/** Shared layout for the auth screens (SDD screens 1-3). */
export const createAuthStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: { gap: spacing.xs, marginBottom: spacing.sm },
    brand: {
      fontSize: fontSize.display,
      fontFamily: fonts.semibold,
      color: c.primary,
      textAlign: 'center',
    },
    title: { fontSize: fontSize.lg, fontFamily: fonts.semibold, color: c.text },
    subtitle: { fontFamily: fonts.regular, fontSize: fontSize.md, color: c.textMuted },
    centeredText: { textAlign: 'center' },
    form: { gap: spacing.md },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
    muted: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    banner: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    bannerText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.text },
    errorText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.danger },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: TOUCH_TARGET,
    },
    checkboxLabel: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.text },
    divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      minHeight: TOUCH_TARGET,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    googleLabel: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.text },
    pressed: { opacity: 0.8 },
  });
