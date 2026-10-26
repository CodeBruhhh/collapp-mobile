import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Button.styles';

type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary: the one main action; secondary: alternatives; danger: destructive; link: inline. */
  variant?: 'primary' | 'secondary' | 'danger' | 'link';
  disabled?: boolean;
  /** Shows a spinner and blocks presses (SDD 6.3 "action buttons with loading states"). */
  loading?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const inactive = disabled || loading;
  const solid = variant === 'primary' || variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
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
        <ActivityIndicator color={solid ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'secondary' && styles.labelSecondary,
            variant === 'danger' && styles.labelDanger,
            variant === 'link' && styles.labelLink,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
