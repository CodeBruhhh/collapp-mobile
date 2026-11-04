import { StyleSheet } from 'react-native';

import { fonts, fontSize, rhythm, spacing, TOUCH_TARGET, type, type ThemeColors } from '@/styles';

/** Shared layout for the auth screens (SDD screens 1-3). */
export const createAuthStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    scroll: { flexGrow: 1 },
    body: { flex: 1, gap: 18, padding: rhythm.gutter },
    form: { gap: 18 },
    actions: { gap: spacing.sm, marginTop: spacing.xs },
    /** Pushes what follows to the bottom of a short screen. */
    push: { flex: 1, justifyContent: 'flex-end' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    rowEnd: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -spacing.sm },
    heading: { ...type.heading, color: c.text },
    bodyText: { ...type.body, color: c.textMuted },
    muted: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    errorText: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.danger },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: TOUCH_TARGET,
    },
    checkboxLabel: { ...type.caption, flex: 1, color: c.text },
    divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    lockMark: {
      alignSelf: 'center',
      width: 112,
      height: 112,
      borderRadius: 56,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
  });
