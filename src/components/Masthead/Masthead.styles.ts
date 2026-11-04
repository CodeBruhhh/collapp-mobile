import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, withAlpha, type ThemeColors } from '@/styles';

const NOTCH = 28;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: {
      paddingHorizontal: rhythm.gutter,
      paddingBottom: rhythm.section,
      backgroundColor: c.primary,
    },
    tall: { minHeight: 288, justifyContent: 'flex-end' },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: -12,
      marginBottom: spacing.sm,
    },
    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    text: { flex: 1, gap: 4 },
    eyebrow: { ...type.overline, color: c.onPrimary },
    title: {
      fontFamily: fonts.serif,
      fontSize: 24,
      lineHeight: 30,
      letterSpacing: -0.8,
      color: c.onPrimary,
    },
    subtitle: { ...type.body, color: c.onPrimary },
    stats: {
      flexDirection: 'row',
      gap: rhythm.section,
      marginTop: 22,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: withAlpha(c.onPrimary, 0.45),
    },
    statValue: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: c.onPrimary },
    statLabel: { ...type.caption, fontSize: 12, color: c.onPrimary },
    // Cut corner, in the page color behind it.
    notch: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      borderLeftWidth: NOTCH,
      borderBottomWidth: NOTCH,
      borderLeftColor: 'transparent',
      borderBottomColor: c.background,
    },
  });
