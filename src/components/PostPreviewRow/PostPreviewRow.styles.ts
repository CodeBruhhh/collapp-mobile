import { StyleSheet } from 'react-native';

import { type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 14,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    first: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    pressed: { backgroundColor: c.surfaceMuted },
    text: { flex: 1, gap: 2 },
    eyebrow: { ...type.overline, color: c.primary },
    meta: { ...type.caption, fontSize: 12, lineHeight: 16, color: c.textMuted },
    title: { ...type.title, color: c.text },
  });
