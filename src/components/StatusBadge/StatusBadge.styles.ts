import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 999,
      borderWidth: 1,
      backgroundColor: c.surface,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  });
