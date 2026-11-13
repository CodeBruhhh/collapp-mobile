import { StyleSheet } from 'react-native';

import { rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    tabs: {
      paddingTop: spacing.xs,
      paddingHorizontal: rhythm.gutter,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    notice: { paddingHorizontal: rhythm.gutter, paddingTop: spacing.sm },
    list: { paddingBottom: spacing.xl },
    suggestions: { gap: spacing.xs, paddingHorizontal: rhythm.gutter },
    heading: { ...type.heading, color: c.text },
  });
