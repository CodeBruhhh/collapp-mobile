import { Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FilterTabs } from '@/components/FilterTabs';
import { MatchCard } from '@/components/MatchCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useRecommendations } from '@/features/ai/hooks';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './RecommendationsScreen.styles';

type Sort = 'match' | 'deadline';

/** SDD screen 8 — AI Exploration Engine results with the reasons behind each match. */
export function RecommendationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [sort, setSort] = useState<Sort>('match');
  const recommendations = useRecommendations();
  const { refresh } = recommendations;

  const list = [...(recommendations.data ?? [])].sort((a, b) =>
    sort === 'match'
      ? b.match_score - a.match_score
      : (a.program?.deadline ?? '9999').localeCompare(b.program?.deadline ?? '9999'),
  );
  const generatedAt = recommendations.data?.[0]?.generated_at;

  async function regenerate() {
    try {
      await refresh.mutateAsync();
    } catch (e) {
      Alert.alert('Could not update recommendations', getErrorMessage(e));
    }
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={list}
      keyExtractor={(r) => r.id}
      refreshControl={<RefreshControl refreshing={refresh.isPending} onRefresh={regenerate} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Stack.Screen options={{ title: 'AI recommendations' }} />
          <Text style={styles.subtitle}>
            Programs matched to your strand, average, preferred courses, locations and interests.
            Matches are suggestions — explore every option.
          </Text>
          <FilterTabs<Sort>
            value={sort}
            onChange={setSort}
            options={[
              { value: 'match', label: 'Best match' },
              { value: 'deadline', label: 'Deadline soonest' },
            ]}
          />
          {generatedAt ? (
            <Text style={styles.meta}>Updated {new Date(generatedAt).toLocaleString()}</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        recommendations.isPending || refresh.isPending ? (
          <LoadingState label="Finding your matches" />
        ) : recommendations.isError ? (
          <ErrorState error={recommendations.error} onRetry={recommendations.refetch} />
        ) : refresh.isError ? (
          <ErrorState error={refresh.error} onRetry={regenerate} />
        ) : (
          <EmptyState
            icon="sparkles-outline"
            title="No matches yet"
            body="No open programs fit right now. Check back as colleges publish programs."
          />
        )
      }
      renderItem={({ item }) => <MatchCard recommendation={item} showReasons />}
      ListFooterComponent={
        list.length ? (
          <Button
            variant="secondary"
            label="Update recommendations"
            onPress={regenerate}
            loading={refresh.isPending}
          />
        ) : null
      }
    />
  );
}
