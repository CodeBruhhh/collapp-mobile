import { StyleSheet } from 'react-native';

import { fonts, radius, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, paddingBottom: spacing.xl, flexGrow: 1 },
    header: { gap: spacing.md, marginBottom: spacing.md },
    // A lifted band running past the gutter, like Section's `band`.
    feedEntry: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginHorizontal: -rhythm.gutter,
      paddingVertical: spacing.md,
      paddingHorizontal: rhythm.gutter,
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    feedEntryPressed: { backgroundColor: c.surfaceMuted },
    feedIcon: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: c.primary,
    },
    feedText: { flex: 1 },
    feedTitle: {
      fontFamily: fonts.serif,
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: -0.4,
      color: c.text,
    },
    feedSubtitle: { ...type.caption, color: c.textMuted },
    filters: { gap: spacing.sm },
    count: { ...type.caption, color: c.textMuted },
    deadline: { paddingTop: spacing.xs },
    followingMark: { ...type.caption, fontSize: 12, fontFamily: fonts.medium, color: c.primary },
  });
