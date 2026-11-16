import { StyleSheet } from 'react-native';

import { fonts, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    compact: { gap: 6 },
    caption: { ...type.caption, fontSize: 12, lineHeight: 16, color: c.textMuted },
    list: { gap: spacing.md },
    paused: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    row: { gap: 6 },
    rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    label: { ...type.body, fontFamily: fonts.medium, color: c.text },
    count: { ...type.caption, fontFamily: fonts.medium, color: c.text },
  });
