import { StyleSheet } from 'react-native';

import { fonts, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    first: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    pressed: { backgroundColor: c.surfaceMuted },
    text: { flex: 1, gap: 2 },
    title: { ...type.title, color: c.text },
    titleStrong: { fontFamily: fonts.semibold },
    subtitle: { ...type.caption, color: c.textMuted },
    subtitleStrong: { fontFamily: fonts.medium, color: c.text },
  });
