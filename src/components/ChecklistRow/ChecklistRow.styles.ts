import { StyleSheet } from 'react-native';

import { fonts, radius, spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    main: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      minHeight: TOUCH_TARGET,
      paddingVertical: 12,
    },
    text: { flex: 1, gap: 2 },
    label: { ...type.label, color: c.text },
    status: { ...type.caption, fontSize: 12 },
    action: {
      minHeight: 36,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: c.text,
      borderRadius: radius.md,
    },
    actionPressed: { opacity: 0.6 },
    actionDisabled: { opacity: 0.45 },
    actionLabel: { fontFamily: fonts.semibold, fontSize: 13, color: c.text },
  });
