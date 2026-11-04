import { StyleSheet } from 'react-native';

import { fonts, type, type ThemeColors } from '@/styles';

export const createStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    mark: { width: 6, height: 6 },
    label: { ...type.caption, fontSize: 12, fontFamily: fonts.medium },
  });
