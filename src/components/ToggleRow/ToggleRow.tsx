import { Switch, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ToggleRow.styles';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Labelled switch on a ruled line; the description runs underneath. */
export function ToggleRow({ label, description, value, onChange, disabled }: ToggleRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.ruled, disabled && styles.disabled]}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Switch
          accessibilityLabel={label}
          accessibilityHint={description}
          value={value}
          onValueChange={onChange}
          disabled={disabled}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.border}
        />
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}
