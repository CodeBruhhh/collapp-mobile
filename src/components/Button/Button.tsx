import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
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
  /** Optional 16pt line glyph before the label, tinted to match it. */
  icon?: IconName;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const inactive = disabled || loading;
  const solid = variant === 'primary' || variant === 'danger';
  const labelColor = {
    primary: colors.onPrimary,
    secondary: colors.text,
    danger: colors.onDanger,
    link: colors.primary,
  }[variant];

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
        <ActivityIndicator color={solid ? labelColor : colors.primary} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={16} color={labelColor} /> : null}
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
        </View>
      )}
    </Pressable>
  );
}
