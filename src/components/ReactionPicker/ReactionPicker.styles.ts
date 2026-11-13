import { StyleSheet } from 'react-native';

import { fixedColors, fonts, radius, rhythm, spacing, type ThemeColors } from '@/styles';

/** Options plus the picker's own padding and border. */
export const PICKER_HEIGHT = 66;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: StyleSheet.absoluteFill,
    picker: {
      position: 'absolute',
      left: rhythm.gutter,
      right: rhythm.gutter,
      height: PICKER_HEIGHT,
      flexDirection: 'row',
      padding: spacing.xs,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.md,
      elevation: 6,
      shadowColor: fixedColors.scrim,
      shadowOpacity: 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    option: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      borderRadius: radius.md,
    },
    optionSelected: { backgroundColor: c.primarySoft },
    label: { fontFamily: fonts.medium, fontSize: 10, lineHeight: 12, color: c.primary },
  });
