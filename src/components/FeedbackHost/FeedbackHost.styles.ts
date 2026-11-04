import { StyleSheet } from 'react-native';

import { radius, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    anchor: { position: 'absolute', left: rhythm.gutter / 2, right: rhythm.gutter / 2 },
    toast: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderTopWidth: 2,
      borderColor: c.border,
      backgroundColor: c.surface,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    text: { flex: 1, gap: 2 },
    title: { ...type.label, color: c.text },
    message: { ...type.caption, color: c.textMuted },
  });
