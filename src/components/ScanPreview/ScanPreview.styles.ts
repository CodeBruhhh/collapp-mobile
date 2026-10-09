import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, gap: spacing.md, padding: spacing.md, backgroundColor: c.background },
    flex: { flex: 1 },
    title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    image: { flex: 1, borderRadius: radius.md, backgroundColor: c.surface },
    meta: { fontSize: fontSize.sm, color: c.textMuted, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: spacing.sm },
  });
