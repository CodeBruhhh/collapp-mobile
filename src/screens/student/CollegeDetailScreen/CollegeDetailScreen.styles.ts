import { StyleSheet } from 'react-native';

import {
  CONTROL_HEIGHT,
  fonts,
  radius,
  rhythm,
  spacing,
  TOUCH_TARGET,
  type,
  type ThemeColors,
} from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { paddingBottom: spacing.lg },
    flex: { flex: 1 },
    navButton: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabs: {
      paddingHorizontal: rhythm.gutter,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    section: { gap: spacing.sm, padding: rhythm.gutter },
    meta: { ...type.caption, color: c.textMuted },
    body: { ...type.body, color: c.text },
    cardTitle: { ...type.title, flexShrink: 1, color: c.text },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      minHeight: TOUCH_TARGET,
    },
    linkText: { ...type.caption, fontFamily: fonts.semibold, color: c.primary },
    ledger: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    program: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
      marginBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    fact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
    },
    factText: { fontFamily: fonts.medium, fontSize: 12, color: c.text },
    optional: { fontFamily: fonts.medium, fontSize: 12, color: c.textMuted },
    iconAction: {
      width: CONTROL_HEIGHT,
      height: CONTROL_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.text,
    },
  });
