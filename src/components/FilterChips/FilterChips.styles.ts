import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    segments: { flexDirection: 'row', gap: spacing.sm, paddingTop: spacing.md },
    segment: {
      flex: 1,
      minHeight: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    segmentSelected: { backgroundColor: c.primary, borderColor: c.primary },
    segmentLabel: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    segmentLabelSelected: { color: c.onPrimary, fontFamily: fonts.semibold },
  });
