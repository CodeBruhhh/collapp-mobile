import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
    title: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.text },
    message: { fontSize: fontSize.sm, color: c.textMuted, textAlign: 'center' },
  });
