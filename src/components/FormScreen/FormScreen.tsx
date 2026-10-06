import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './FormScreen.styles';

type FormScreenProps = {
  children: ReactNode;
  /** Vertically center short forms such as login. */
  centered?: boolean;
};

/** Keyboard-aware, scrollable container for auth and form screens without a header. */
export function FormScreen({ children, centered }: FormScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, centered && styles.centered]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
