import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: rhythm.gutter,
      paddingTop: rhythm.gutter,
    },
    text: { flex: 1, gap: 6 },
    name: { fontSize: 19, fontFamily: fonts.semibold, letterSpacing: -0.4, color: c.text },
    email: { fontFamily: fonts.regular, fontSize: 13, color: c.textMuted },
  });
