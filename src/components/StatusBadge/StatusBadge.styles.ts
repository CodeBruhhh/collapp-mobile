import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.lg,
      borderWidth: 1,
      backgroundColor: c.surface,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    text: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  });
