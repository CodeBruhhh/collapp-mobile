import { StyleSheet } from 'react-native';

import {
  editorialSpace,
  fontSize,
  fontWeight,
  spacing,
  type ThemeColors,
  type ThemeTokens,
} from '@/styles';

const AVATAR_SIZE = 56;

export const createStyles = (c: ThemeColors, t: ThemeTokens) =>
  StyleSheet.create({
    container: t.editorial
      ? {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingHorizontal: editorialSpace.gutter,
          paddingTop: editorialSpace.gutter,
        }
      : {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: t.radius.lg,
          padding: spacing.md,
        },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
    },
    initials: {
      fontSize: fontSize.lg,
      fontWeight: t.editorial ? fontWeight.semibold : fontWeight.bold,
      letterSpacing: t.editorial ? 0.5 : 0,
      color: c.primary,
    },
    text: { flex: 1, gap: t.editorial ? 6 : 2 },
    name: t.editorial
      ? { fontSize: 19, fontWeight: fontWeight.semibold, letterSpacing: -0.4, color: c.text }
      : { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: c.text },
    email: { fontSize: t.editorial ? 13 : fontSize.sm, color: c.textMuted },
  });
