import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, lineHeight, radius, spacing, type ThemeColors } from '@/styles';

/** Inline photos and file cards share one width so a conversation lines up. */
export const PHOTO_WIDTH = 232;

const BUBBLE_RADIUS = 18;
const JOINED_RADIUS = 6;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', marginBottom: 2 },
    rowMine: { justifyContent: 'flex-end' },
    // Extra space after the last message of a run separates speakers.
    rowLast: { marginBottom: spacing.sm },
    column: { maxWidth: '80%', alignItems: 'flex-start', gap: 4 },
    columnMine: { alignItems: 'flex-end' },
    failed: { opacity: 0.6 },

    bubble: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md - 2,
      borderRadius: BUBBLE_RADIUS,
    },
    bubbleWithAttachment: { padding: spacing.xs },
    mine: { backgroundColor: c.primary },
    theirs: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    mineJoinTop: { borderTopRightRadius: JOINED_RADIUS },
    mineJoinBottom: { borderBottomRightRadius: JOINED_RADIUS },
    theirsJoinTop: { borderTopLeftRadius: JOINED_RADIUS },
    theirsJoinBottom: { borderBottomLeftRadius: JOINED_RADIUS },

    body: { fontSize: fontSize.md, lineHeight: lineHeight.md - 2, color: c.text },
    bodyMine: { color: c.onPrimary },
    caption: { paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: 2 },

    status: { fontSize: fontSize.xs, color: c.textMuted, paddingHorizontal: spacing.xs },
    statusMine: { textAlign: 'right' },
    error: { color: c.danger, fontWeight: fontWeight.medium },

    photo: {
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: c.surfaceMuted,
    },
    photoImage: { ...StyleSheet.absoluteFill },
    photoOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    photoNotice: { height: 120, gap: spacing.sm, padding: spacing.md },
    noticeText: { fontSize: fontSize.sm, color: c.textMuted, textAlign: 'center' },
    blocked: { color: c.danger },

    file: {
      width: PHOTO_WIDTH,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: c.surfaceMuted,
    },
    fileMine: { backgroundColor: c.surface },
    filePressed: { opacity: 0.8 },
    fileIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    fileIconBlocked: { backgroundColor: c.surfaceMuted },
    fileText: { flex: 1, gap: 2 },
    fileName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.text },
    fileMeta: { fontSize: fontSize.xs, color: c.textMuted },
  });
