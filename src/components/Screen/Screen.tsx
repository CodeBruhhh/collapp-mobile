import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Screen.styles';

/** Themed, scrollable page container shared by every screen. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  // React Compiler (enabled in app.json) memoizes this, so no useMemo needed.
  const styles = createStyles(colors);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}
