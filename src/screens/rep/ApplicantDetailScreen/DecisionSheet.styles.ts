import { StyleSheet } from 'react-native';

import {
  fonts,
  fontSize,
  radius,
  rhythm,
  spacing,
  TOUCH_TARGET,
  type,
  withAlpha,
  type ThemeColors,
} from '@/styles';

export const createDecisionStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 52,
      paddingHorizontal: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.surface,
    },
    headerSide: { width: 72, minHeight: TOUCH_TARGET, justifyContent: 'center' },
    cancel: { fontFamily: fonts.regular, fontSize: fontSize.md, color: c.primary },
    title: {
      ...type.heading,
      flex: 1,
      textAlign: 'center',
      color: c.text,
    },
    content: { padding: rhythm.gutter, gap: spacing.lg },

    options: { flexDirection: 'row', gap: spacing.sm },
    option: {
      flex: 1,
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    optionAdmit: {
      borderColor: c.status.accepted,
      backgroundColor: withAlpha(c.status.accepted, 0.06),
    },
    optionDecline: { borderColor: c.danger, backgroundColor: withAlpha(c.danger, 0.06) },
    optionDisabled: { opacity: 0.55 },
    optionTitle: { fontSize: fontSize.md, fontFamily: fonts.semibold, color: c.text },
    optionHint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: c.textMuted },

    group: { gap: spacing.sm },
    label: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: c.text },
    program: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: TOUCH_TARGET + 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    programActive: { borderColor: c.primary, backgroundColor: c.primarySoft },
    programName: { fontSize: fontSize.md, fontFamily: fonts.medium, color: c.text },

    reset: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
    resetText: { fontSize: fontSize.sm, fontFamily: fonts.semibold, color: c.primary },
    prompt: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
    },

    footer: {
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
  });
