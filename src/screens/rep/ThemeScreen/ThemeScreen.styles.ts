import { StyleSheet } from 'react-native';

import { CONTROL_HEIGHT, fonts, radius, spacing, type, type ThemeColors } from '@/styles';

const CHIP = 32;
const SWATCH = 32;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    pressed: { backgroundColor: c.surfaceMuted },
    status: { ...type.overline, color: c.textMuted },

    preview: {
      overflow: 'hidden',
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    previewHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      paddingBottom: spacing.md + 6,
    },
    previewName: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22 },
    previewPlace: { ...type.caption, fontSize: 12 },
    previewStripe: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 6,
      flexDirection: 'row',
    },
    stripeMain: { flex: 2 },
    stripeEnd: { flex: 1 },
    previewBody: { gap: spacing.md, padding: spacing.md },
    previewTabs: {
      flexDirection: 'row',
      gap: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    previewTab: { ...type.caption, paddingBottom: spacing.sm, color: c.textMuted },
    previewTabActive: {
      fontFamily: fonts.semibold,
      color: c.primary,
      borderBottomWidth: 2,
      borderBottomColor: c.primary,
    },
    previewFact: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
    },
    previewFactText: { fontFamily: fonts.medium, fontSize: 12, color: c.text },
    previewButton: {
      height: CONTROL_HEIGHT - 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      backgroundColor: c.primary,
    },
    previewButtonText: { fontFamily: fonts.semibold, fontSize: 15, color: c.onPrimary },
    previewNote: {
      ...type.caption,
      fontSize: 12,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      color: c.textMuted,
    },

    slot: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    slotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      paddingVertical: spacing.sm,
    },
    chip: {
      width: CHIP,
      height: CHIP,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    slotLabel: { ...type.title, color: c.text },
    slotUse: { ...type.caption, fontSize: 12, color: c.textMuted },
    hex: { fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.5, color: c.text },
    editor: { gap: spacing.md, paddingBottom: spacing.md },

    swatchGroup: { gap: spacing.sm },
    swatchTitle: { ...type.caption, fontSize: 12, color: c.textMuted },
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    swatchRing: {
      padding: 3,
      borderRadius: radius.md + 3,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    swatchRingActive: { borderColor: c.text },
    swatch: {
      width: SWATCH,
      height: SWATCH,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },

    actions: { gap: spacing.sm },
    hint: { ...type.caption, color: c.textMuted, textAlign: 'center' },
  });
