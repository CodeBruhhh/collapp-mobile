import { StyleSheet } from 'react-native';

import { rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    header: { gap: rhythm.gutter },
    heading: { gap: spacing.sm },
    eyebrow: { ...type.overline, color: c.primary },
    title: { ...type.display, color: c.text },
    subtitle: { ...type.body, color: c.textMuted },
    form: { gap: 18 },
    side: { flex: 1 },
    main: { flex: 2 },
  });
