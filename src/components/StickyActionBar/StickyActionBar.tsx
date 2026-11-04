import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './StickyActionBar.styles';

/** Screen-level actions pinned above the system bar; put it after the scrolling content. */
export function StickyActionBar({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView edges={['bottom']} style={styles.bar}>
      <View style={styles.row}>{children}</View>
    </SafeAreaView>
  );
}
