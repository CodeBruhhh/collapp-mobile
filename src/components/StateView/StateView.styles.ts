import { StyleSheet } from 'react-native';

import {
  fontSize,
  fontWeight,
  lineHeight,
  spacing,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

const ICON_CIRCLE = 64;

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    iconCircle: {
      width: ICON_CIRCLE,
      height: ICON_CIRCLE,
      borderRadius: ICON_CIRCLE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      backgroundColor: c.surfaceMuted,
    },
    title: {
      fontFamily: t.headingFont,
      fontSize: t.headingFont ? fontSize.lg : fontSize.md,
      fontWeight: t.headingFont ? fontWeight.regular : fontWeight.semibold,
      color: c.text,
      textAlign: 'center',
    },
    body: {
      maxWidth: 320,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    action: { marginTop: spacing.sm, alignSelf: 'stretch' },
  });
