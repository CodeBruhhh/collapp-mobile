import { StyleSheet } from 'react-native';

import {
  editorialSpace,
  fontSize,
  fontWeight,
  spacing,
  TOUCH_TARGET,
  withAlpha,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: withAlpha('#0B1211', 0.45),
    },
    // Cap against the full-height backdrop; inner layers shrink so long content scrolls.
    frame: { maxHeight: '88%' },
    shrink: { flexShrink: 1 },
    sheet: {
      flexShrink: 1,
      paddingHorizontal: editorialSpace.gutter,
      paddingTop: spacing.sm,
      backgroundColor: c.surface,
      borderTopLeftRadius: t.editorial ? t.radius.lg : 20,
      borderTopRightRadius: t.editorial ? t.radius.lg : 20,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      marginBottom: spacing.md,
      borderRadius: 2,
      backgroundColor: c.border,
    },
    header: { gap: 6, paddingBottom: spacing.md },
    eyebrow: {
      fontSize: 10,
      fontWeight: fontWeight.semibold,
      letterSpacing: 1,
      color: c.primary,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: t.headingFont,
      fontSize: 22,
      lineHeight: 28,
      letterSpacing: -0.6,
      color: c.text,
    },
    titleDanger: { color: c.danger },
    subtitle: { fontSize: 13, lineHeight: 19, color: c.textMuted },
    message: { fontSize: 14, lineHeight: 21, color: c.text, paddingBottom: spacing.md },
    details: {
      paddingBottom: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    actions: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: TOUCH_TARGET + 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    actionText: { flex: 1, gap: 2, paddingVertical: 12 },
    actionLabel: { fontSize: 15, fontWeight: fontWeight.medium, color: c.primary },
    actionDanger: { color: c.danger },
    actionHint: { fontSize: 12, lineHeight: 17, color: c.textMuted },
    actionPressed: { backgroundColor: c.surfaceMuted },
    actionDisabled: { opacity: 0.45 },
    icon: { width: 16, height: 16 },
    error: { paddingTop: spacing.md, fontSize: fontSize.sm, color: c.danger },
    footer: { paddingTop: spacing.lg, paddingBottom: spacing.md },
  });
