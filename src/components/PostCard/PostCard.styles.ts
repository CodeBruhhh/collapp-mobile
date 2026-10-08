import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: TOUCH_TARGET,
    },
    college: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.text },
    meta: { fontSize: fontSize.xs, color: c.textMuted },
    title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    date: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.primary },
    image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md },
    body: { fontSize: fontSize.md, color: c.text, lineHeight: 22 },
    more: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.primary },
  });
