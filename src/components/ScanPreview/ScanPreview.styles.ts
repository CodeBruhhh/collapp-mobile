import { StyleSheet } from 'react-native';

import { fonts, fontSize, radius, spacing, type ThemeColors } from '@/styles';

const THUMB_WIDTH = 52;
const THUMB_HEIGHT = 68;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, gap: spacing.md, padding: spacing.md, backgroundColor: c.background },
    flex: { flex: 1 },
    header: { gap: 2 },
    title: { fontSize: fontSize.lg, fontFamily: fonts.semibold, color: c.text },
    pageCount: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: c.textMuted },
    image: { flex: 1, borderRadius: radius.md, backgroundColor: c.surface },
    strip: { gap: spacing.sm, paddingVertical: 2 },
    thumb: {
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: c.surface,
    },
    thumbSelected: { borderColor: c.primary },
    thumbImage: { ...StyleSheet.absoluteFill },
    thumbNumber: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      minWidth: 16,
      paddingHorizontal: 3,
      borderRadius: radius.sm,
      overflow: 'hidden',
      textAlign: 'center',
      fontFamily: fonts.semibold,
      fontSize: 11,
      color: c.onPrimary,
      backgroundColor: c.primary,
    },
    addPage: {
      gap: 2,
      borderStyle: 'dashed',
      borderWidth: 1,
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    addPageLabel: { fontFamily: fonts.medium, fontSize: 10, color: c.primary },
    error: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: c.danger,
      textAlign: 'center',
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    meta: {
      fontFamily: fonts.regular,
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: 'center',
    },
    actions: { flexDirection: 'row', gap: spacing.sm },
  });
