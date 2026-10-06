import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: { gap: spacing.sm },
    title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.text },
    step: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.textMuted },
    track: { height: 6, borderRadius: radius.sm, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: c.primary },
    subtitle: { fontSize: fontSize.sm, color: c.textMuted },
    form: { gap: spacing.md },
    actions: { gap: spacing.sm, marginTop: spacing.md },
  });
