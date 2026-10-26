import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, spacing, TOUCH_TARGET } from '@/styles';

// Always dark, whatever the theme: photos read best on black.
export const createStyles = () =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000000' },
    zoom: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: '100%' },
    bar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    title: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: '#FFFFFF' },
    close: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
