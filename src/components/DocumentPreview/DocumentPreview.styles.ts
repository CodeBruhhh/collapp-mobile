import { StyleSheet } from 'react-native';

import { radius, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    preview: {
      height: 180,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    image: { width: '100%', height: '100%' },
    status: {
      ...type.caption,
      paddingHorizontal: spacing.md,
      textAlign: 'center',
      color: c.textMuted,
    },
  });
