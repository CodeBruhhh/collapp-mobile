import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, TOUCH_TARGET, type ThemeColors } from '@/styles';

const THUMB = 40;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    list: { flex: 1 },
    listContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexGrow: 1 },

    day: { alignItems: 'center', marginVertical: spacing.md },
    dayText: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 2,
      borderRadius: radius.pill,
      overflow: 'hidden',
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: c.textMuted,
      backgroundColor: c.surfaceMuted,
    },

    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.sm,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 140,
      marginVertical: 2,
      paddingHorizontal: spacing.md,
      paddingTop: 10,
      paddingBottom: 10,
      borderRadius: 20,
      backgroundColor: c.surfaceMuted,
      color: c.text,
      fontSize: fontSize.md,
    },
    iconButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: TOUCH_TARGET / 2,
    },
    sendButton: { backgroundColor: c.primary },
    disabled: { opacity: 0.35 },

    pending: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.sm,
      marginTop: spacing.sm,
      paddingLeft: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    pendingThumb: { width: THUMB, height: THUMB, borderRadius: radius.sm, margin: 2 },
    pendingIcon: {
      width: THUMB,
      height: THUMB,
      margin: 2,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    pendingName: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: c.text },

    readOnlyNotice: { paddingVertical: spacing.md },
    notice: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
  });
