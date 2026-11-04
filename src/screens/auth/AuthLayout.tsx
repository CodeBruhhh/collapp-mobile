import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Masthead } from '@/components/Masthead';
import { Wordmark } from '@/components/Wordmark';
import { useTheme } from '@/hooks/useTheme';

import { createAuthStyles } from './authStyles';

type AuthLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  /** The opening version: taller, with the CollApp wordmark as its headline. */
  brand?: boolean;
};

/** Teal masthead over a scrolling form; the header scrolls away so the keyboard never traps it. */
export function AuthLayout({ children, title, subtitle, eyebrow, brand }: AuthLayoutProps) {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
        keyboardShouldPersistTaps="handled">
        <Masthead
          tall={brand}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          brand={brand ? <Wordmark size={44} onAccent /> : undefined}
        />
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
