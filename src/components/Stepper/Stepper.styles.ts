import { StyleSheet } from 'react-native';

import { fonts, type, type ThemeColors } from '@/styles';

const MARK = 26;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: 10 },
    track: { flexDirection: 'row', alignItems: 'center' },
    item: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    itemLast: { flex: 0 },
    mark: {
      width: MARK,
      height: MARK,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
    },
    markDone: { backgroundColor: c.primary, borderColor: c.primary },
    markActive: { borderColor: c.primary },
    number: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted },
    numberActive: { fontFamily: fonts.semibold, color: c.primary },
    line: { flex: 1, height: 1.5, backgroundColor: c.border },
    lineDone: { backgroundColor: c.primary },
    caption: { ...type.caption, color: c.textMuted },
  });
