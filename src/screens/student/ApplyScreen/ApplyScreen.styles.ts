import { StyleSheet } from 'react-native';

import { fonts, rhythm, spacing, type, type ThemeColors } from '@/styles';

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: { padding: rhythm.gutter, gap: rhythm.gutter },
    flex: { flex: 1 },
    main: { flex: 2 },
    heading: { gap: spacing.xs },
    title: { ...type.display, color: c.text },
    subtitle: { ...type.body, color: c.textMuted },
    form: { gap: 18 },
    section: { gap: spacing.sm },
    review: { gap: rhythm.gutter },
    sectionTitle: { ...type.heading, color: c.text },
    meta: { ...type.caption, color: c.textMuted },
    note: { ...type.caption, color: c.status.actionRequired },
    choiceRow: { flexDirection: 'row', gap: spacing.sm },
    deleteDraft: { alignItems: 'center' },
    // One requirement, ruled off like the other ledgers.
    req: {
      gap: 10,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    reqHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    reqText: { flex: 1, gap: 2 },
    reqLabel: { ...type.title, fontFamily: fonts.medium, color: c.text },
    reqActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  });
