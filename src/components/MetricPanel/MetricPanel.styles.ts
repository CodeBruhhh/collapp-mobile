import { StyleSheet } from 'react-native';

import { fonts, type, type ThemeColors } from '@/styles';

export const PANEL_WIDTH = 164;
const PANEL_HEIGHT = 160;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    panel: {
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      padding: 18,
      justifyContent: 'space-between',
    },
    shape: { position: 'absolute', top: 0, left: 0, width: PANEL_WIDTH, height: PANEL_HEIGHT },
    heading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    label: { ...type.caption, flexShrink: 1, color: c.onPrimary },
    value: { fontFamily: fonts.serif, fontSize: 64, lineHeight: 72, color: c.onPrimary },
    valueWithCaption: { fontSize: 52, lineHeight: 60 },
    caption: { ...type.caption, fontSize: 12, color: c.onPrimary },
  });
