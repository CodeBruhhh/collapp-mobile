import { StyleSheet } from 'react-native';

import {
  fontSize,
  fontWeight,
  spacing,
  TOUCH_TARGET,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    row: { gap: spacing.sm },
    chip: {
      minHeight: TOUCH_TARGET,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipSelected: { backgroundColor: c.primarySoft, borderColor: c.primary },
    label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },
    labelSelected: { color: c.primary, fontWeight: fontWeight.semibold },
    segments: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
    segment: {
      flex: 1,
      minHeight: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    segmentSelected: { backgroundColor: c.primary, borderColor: c.primary },
    segmentLabel: { fontSize: fontSize.sm, color: c.textMuted },
    segmentLabelSelected: { color: c.onPrimary, fontWeight: fontWeight.semibold },
  });
