import { StyleSheet } from 'react-native';

import { fonts, type, type ThemeColors } from '@/styles';

const MARK = 22;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    step: { flexDirection: 'row', gap: 14 },
    rail: { width: MARK, alignItems: 'center' },
    mark: {
      width: MARK,
      height: MARK,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: c.border,
    },
    markDone: { backgroundColor: c.primary, borderColor: c.primary },
    markCurrent: { borderColor: c.primary },
    markAlert: { backgroundColor: c.danger, borderColor: c.danger },
    markText: { fontFamily: fonts.semibold, fontSize: 12, color: c.onPrimary },
    line: { flex: 1, width: 1.5, minHeight: 20, backgroundColor: c.border },
    lineDone: { backgroundColor: c.primary },
    body: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      paddingBottom: 20,
    },
    bodyLast: { paddingBottom: 0 },
    label: { ...type.title, fontFamily: fonts.regular, color: c.text },
    labelUpcoming: { color: c.textMuted },
    labelCurrent: { fontFamily: fonts.semibold, color: c.primary },
    labelAlert: { fontFamily: fonts.semibold, color: c.danger },
    date: { ...type.caption, fontSize: 12, lineHeight: 21, color: c.textMuted },
  });
