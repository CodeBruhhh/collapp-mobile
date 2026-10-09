import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Card.styles';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Surface container; pressable when `onPress` is given. */
export function Card({ children, onPress, accessibilityLabel, style }: CardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      {children}
    </Pressable>
  );
}
