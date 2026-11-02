import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Screen.styles';

/** Themed, scrollable page container shared by every screen. */
export function Screen({ children }: { children: ReactNode }) {
  const { colors, tokens } = useTheme();
  // React Compiler (enabled in app.json) memoizes this, so no useMemo needed.
  const styles = createStyles(colors, tokens);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: styles.content.paddingBottom + insets.bottom },
      ]}
      contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}
