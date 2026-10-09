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

/** Labelled switch; the whole row is announced as one control. */
export function ToggleRow({ label, description, value, onChange, disabled }: ToggleRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={description}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}
