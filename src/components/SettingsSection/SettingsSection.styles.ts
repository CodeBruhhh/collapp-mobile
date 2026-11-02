import { StyleSheet } from 'react-native';

import {
  editorialSpace,
  fontSize,
  fontWeight,
  spacing,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    title: {
      paddingHorizontal: spacing.xs,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      letterSpacing: 0.6,
      color: c.textMuted,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: t.radius.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    // Editorial: a full-width section whose rows rule themselves off.
    ledger: {
      gap: spacing.xs,
      paddingTop: editorialSpace.section,
      paddingHorizontal: editorialSpace.gutter,
    },
    // A lifted sheet band, like the chart band on Analytics.
    band: {
      marginTop: editorialSpace.section,
      paddingBottom: editorialSpace.section,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    ledgerTitle: {
      fontFamily: t.headingFont,
      fontSize: 19,
      lineHeight: 26,
      letterSpacing: -0.5,
      color: c.text,
    },
  });
