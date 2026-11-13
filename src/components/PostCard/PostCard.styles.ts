import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    post: {
      gap: spacing.sm,
      paddingTop: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: rhythm.gutter,
    },
    college: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: TOUCH_TARGET,
    },
    flex: { flex: 1 },
    name: { ...type.title, color: c.text },
    eyebrow: { ...type.overline, color: c.primary },
    meta: { ...type.caption, fontSize: 12, lineHeight: 16, color: c.textMuted },
    opener: { gap: spacing.sm },
    title: {
      paddingHorizontal: rhythm.gutter,
      fontFamily: fonts.serif,
      fontSize: 17,
      lineHeight: 24,
      color: c.text,
    },
    date: {
      ...type.caption,
      paddingHorizontal: rhythm.gutter,
      fontFamily: fonts.medium,
      color: c.primary,
    },
    // Runs edge to edge: the one lift in the feed's ruled rhythm.
    image: { width: '100%', aspectRatio: 16 / 9, marginTop: spacing.xs },
    body: {
      ...type.body,
      marginTop: spacing.xs,
      paddingHorizontal: rhythm.gutter,
      color: c.textMuted,
    },
    more: {
      ...type.caption,
      paddingHorizontal: rhythm.gutter,
      fontFamily: fonts.semibold,
      color: c.primary,
    },
  });
