import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles, PAGE_END } from './Screen.styles';

/** Themed, full-width scrolling page; sections bring their own gutter. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  // React Compiler (enabled in app.json) memoizes this, so no useMemo needed.
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: PAGE_END + insets.bottom }}
      contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}
