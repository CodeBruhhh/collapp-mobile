import { StyleSheet } from 'react-native';

import { fonts, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    text: { flex: 1 },
    meta: { ...type.caption, color: c.textMuted },
    name: { fontFamily: fonts.semibold, color: c.text },
    body: { ...type.body, color: c.text },
    delete: { alignSelf: 'flex-start', paddingTop: 6 },
    deleteText: { ...type.caption, fontSize: 12, fontFamily: fonts.medium, color: c.textMuted },
    trash: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      marginTop: -6,
      marginRight: -12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
