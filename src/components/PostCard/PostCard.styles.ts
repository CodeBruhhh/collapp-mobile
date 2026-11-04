import { StyleSheet } from 'react-native';

import { fonts, radius, spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    post: {
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    flex: { flex: 1, gap: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: TOUCH_TARGET,
    },
    eyebrow: { ...type.overline, color: c.primary },
    meta: { ...type.caption, fontSize: 12, color: c.textMuted },
    title: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 24, color: c.text },
    date: { ...type.caption, fontFamily: fonts.medium, color: c.primary },
    image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
    body: { ...type.body, color: c.textMuted },
    more: { ...type.caption, fontFamily: fonts.semibold, color: c.primary },
  });
