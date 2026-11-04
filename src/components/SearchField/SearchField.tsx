import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SearchField.styles';

type SearchFieldProps = Omit<TextInputProps, 'style'> & {
  /** Runs after the clear button empties the field. */
  onClear?: () => void;
};

/** Underlined search input with a clear button once there is text. */
export function SearchField({ value, onChangeText, onClear, ...inputProps }: SearchFieldProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.box}>
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        returnKeyType="search"
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => {
            onChangeText?.('');
            onClear?.();
          }}
          style={styles.clear}>
          <Icon name="close-circle-filled" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}
