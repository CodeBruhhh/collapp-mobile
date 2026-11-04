import { StyleSheet } from 'react-native';

import { type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: 10 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { ...type.display, flex: 1, color: c.text },
    subtitle: { ...type.body, color: c.textMuted },
  });
