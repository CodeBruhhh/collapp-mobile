import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Button.styles';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  /** Shows a spinner and blocks presses (SDD 6.3 "action buttons with loading states"). */
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        inactive && styles.inactive,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'secondary' && styles.labelSecondary,
            variant === 'link' && styles.labelLink,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
