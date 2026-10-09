import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './TextField.styles';

type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  /** Helper text shown under the field when there is no error. */
  hint?: string;
};

/** Labelled text input with inline error, screen-reader label and password reveal. */
export function TextField({ label, error, hint, secureTextEntry, ...inputProps }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [revealed, setRevealed] = useState(false);
  const isSecret = Boolean(secureTextEntry);

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          {...inputProps}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          secureTextEntry={isSecret && !revealed}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {isSecret ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setRevealed((v) => !v)}
            style={styles.reveal}>
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}
