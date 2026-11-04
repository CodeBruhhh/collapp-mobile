import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './FormScreen.styles';

type FormScreenProps = {
  children: ReactNode;
  /** Pinned below the scrolling form, e.g. a StickyActionBar (it handles the bottom edge). */
  footer?: ReactNode;
  /** Set when a stack header already covers the top of the screen. */
  underHeader?: boolean;
};

/** Keyboard-aware, scrollable container for form screens. */
export function FormScreen({ children, footer, underHeader }: FormScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const edges: Edge[] = ['left', 'right'];
  if (!underHeader) edges.push('top');
  if (!footer) edges.push('bottom');

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
