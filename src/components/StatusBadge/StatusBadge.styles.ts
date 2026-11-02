import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors, type ThemeTokens } from '@/styles';

export const createStyles = (_c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: t.radius.pill,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    outlined: { paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1 },
    caps: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  });
