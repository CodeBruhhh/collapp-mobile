import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Select.styles';

type SelectProps = {
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

/** Dropdown-style field that opens a searchable full-screen list. */
export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  error,
  disabled,
}: SelectProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  function choose(option: string) {
    onChange(option);
    setOpen(false);
    setQuery('');
  }

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? 'not selected'}`}
        accessibilityHint={error}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, error ? styles.fieldError : null, disabled && styles.disabled]}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              {label}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={() => setOpen(false)}
              style={styles.close}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
          {options.length > 8 ? (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={`Search ${label}`}
              style={styles.search}
              autoFocus
            />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: item === value }}
                onPress={() => choose(item)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
                <Text style={styles.optionText}>{item}</Text>
                {item === value ? (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
