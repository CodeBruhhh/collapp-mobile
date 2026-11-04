import { StyleSheet } from 'react-native';

import { fonts, fontSize, lineHeight, spacing, type ThemeColors } from '@/styles';

const ICON_CIRCLE = 64;

export const createStyles = (c: ThemeColors) =>
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
      fontFamily: fonts.serif,
      fontSize: fontSize.lg,
      color: c.text,
      textAlign: 'center',
    },
    body: {
      maxWidth: 320,
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      lineHeight: lineHeight.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    action: { marginTop: spacing.sm, alignSelf: 'stretch' },
  });
