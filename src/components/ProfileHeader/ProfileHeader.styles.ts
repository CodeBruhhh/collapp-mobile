import { StyleSheet } from 'react-native';

import { fontSize, fontWeight, radius, spacing, type ThemeColors } from '@/styles';

const AVATAR_SIZE = 64;

export const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
    },
    text: { flex: 1, gap: 2 },
    name: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.text },
    email: { fontSize: fontSize.sm, color: c.textMuted },
  });
