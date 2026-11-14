import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { SafeAreaView, useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { KeyboardAwareScrollView, KeyboardStickyView } from '@/lib/keyboard';
import { KEYBOARD_GAP } from '@/styles';

import { createStyles } from './FormScreen.styles';

type FormScreenProps = {
  children: ReactNode;
  /** Pinned below the scrolling form, e.g. a StickyActionBar (it handles the bottom edge). */
  footer?: ReactNode;
  /** Set when a stack header already covers the top of the screen. */
  underHeader?: boolean;
  /** Set inside a tab: the tab bar already covers the bottom of the screen. */
  inTab?: boolean;
};

/**
 * Scrollable container for form screens. The focused field is always scrolled
 * clear of the keyboard, and the footer rides on top of the keyboard so the
 * primary action stays reachable while typing.
 */
export function FormScreen({ children, footer, underHeader, inTab }: FormScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(0);
  const edges: Edge[] = ['left', 'right'];
  if (!underHeader) edges.push('top');
  if (!footer && !inTab) edges.push('bottom');

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {underHeader ? null : <StatusBar style="auto" />}
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        // The footer covers the space just above the keyboard; keep fields above it.
        bottomOffset={KEYBOARD_GAP + footerHeight}
        keyboardShouldPersistTaps="handled">
        {children}
      </KeyboardAwareScrollView>
      {footer ? (
        <KeyboardStickyView
          // The footer's own safe-area padding tucks behind the keyboard.
          offset={{ opened: insets.bottom }}
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height - insets.bottom)}>
          {footer}
        </KeyboardStickyView>
      ) : null}
    </SafeAreaView>
  );
}
