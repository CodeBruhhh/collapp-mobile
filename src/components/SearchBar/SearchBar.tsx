import { Ionicons } from '@expo/vector-icons';
import { TextInput, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SearchBar.styles';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
    </View>
  );
}
