import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

const LOGO_SIZE = 48;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    logo: {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
    },
    titles: { flex: 1 },
    caption: { fontSize: fontSize.sm, color: c.textMuted },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
  });