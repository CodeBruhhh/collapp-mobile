import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import type { Query } from '@/hooks/useQuery';

import { createStyles } from './QueryState.styles';

type QueryStateProps<T> = {
  query: Query<T>;
  children: (data: T) => ReactNode;
};

/** Renders a spinner, an error with retry, or `children(data)` for a `useQuery` result. */
export function QueryState<T>({ query, children }: QueryStateProps<T>) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (query.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Loading" />
      </View>
    );
  }

  if (query.status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{query.message}</Text>
        <Button label="Try again" variant="secondary" onPress={query.reload} />
      </View>
    );
  }

  return <>{children(query.data)}</>;
}
