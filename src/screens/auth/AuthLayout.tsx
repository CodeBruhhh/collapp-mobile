import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Masthead } from '@/components/Masthead';
import { Wordmark } from '@/components/Wordmark';
import { useTheme } from '@/hooks/useTheme';
import { KeyboardAwareScrollView } from '@/lib/keyboard';
import { KEYBOARD_GAP } from '@/styles';

import { createAuthStyles } from './authStyles';

type AuthLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  /** The opening version: taller, with the CollApp wordmark as its headline. */
  brand?: boolean;
};

/**
 * Teal masthead over a scrolling form. The header scrolls away, and the focused
 * field is always scrolled above the keyboard on both platforms.
 */
export function AuthLayout({ children, title, subtitle, eyebrow, brand }: AuthLayoutProps) {
  const { colors } = useTheme();
  const styles = createAuthStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={styles.root}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
      bottomOffset={KEYBOARD_GAP}
      keyboardShouldPersistTaps="handled">
      <Masthead
        tall={brand}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        brand={brand ? <Wordmark size={44} onAccent /> : undefined}
      />
      <View style={styles.body}>{children}</View>
    </KeyboardAwareScrollView>
  );
}
