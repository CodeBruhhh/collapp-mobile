import { router } from 'expo-router';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { usePosts } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createRepStyles } from '../repStyles';

const openEditor = (id: string) => router.push({ pathname: '/rep/post/[id]', params: { id } });

/** Campus posts (SRS 3.1.2.3) — drafts and published items that feed student timelines. */
export function PostsScreen() {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const posts = usePosts();

  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={styles.content}
        data={posts.data ?? []}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl refreshing={posts.isRefetching} onRefresh={posts.refetch} />
        }
        ListHeaderComponent={<Button label="New post" onPress={() => openEditor('new')} />}
        ListEmptyComponent={
          posts.isPending ? (
            <LoadingState />
          ) : posts.isError ? (
            <ErrorState error={posts.error} onRetry={posts.refetch} />
          ) : (
            <EmptyState
              icon="megaphone-outline"
              title="No posts yet"
              body="Share campus news, events, scholarships and deadlines with students."
            />
          )
        }
        renderItem={({ item }) => (
          <Card onPress={() => openEditor(item.id)}>
            <View style={styles.rowBetween}>
              <Text style={styles.meta}>{POST_TYPE_LABELS[item.type]}</Text>
              <StatusBadge
                label={item.status === 'published' ? 'Published' : 'Draft'}
                color={item.status === 'published' ? colors.status.accepted : colors.status.draft}
              />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.meta}>
              {item.published_at
                ? `Published ${new Date(item.published_at).toLocaleDateString()}`
                : `Edited ${new Date(item.updated_at).toLocaleDateString()}`}
            </Text>
          </Card>
        )}
      />
    </View>
  );
}
