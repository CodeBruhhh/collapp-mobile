import { router } from 'expo-router';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useEngagement } from '@/features/feed/hooks';
import { plural, totalReactions } from '@/features/feed/reactions';
import { POST_TYPE_LABELS } from '@/features/rep/posts';
import { usePosts } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createScreenStyles } from '@/screens/screenStyles';

const openEditor = (id: string) => router.push({ pathname: '/rep/post/[id]', params: { id } });
const openInsights = (id: string) =>
  router.push({ pathname: '/rep/insights/[id]', params: { id } });

/** Campus posts (SRS 3.1.2.3) — drafts and published items that feed student timelines. */
export function PostsScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const posts = usePosts();
  const engagement = useEngagement(
    (posts.data ?? []).filter((p) => p.status === 'published').map((p) => p.id),
  );

  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={posts.data ?? []}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl
            tintColor={colors.primary}
            colors={[colors.primary]}
            refreshing={posts.isRefetching}
            onRefresh={posts.refetch}
          />
        }
        ListHeaderComponent={
          <View style={[styles.section, styles.listHeader]}>
            <PageHeading
              title="Campus posts"
              subtitle="News, events, scholarships and deadlines for student feeds."
            />
            <Button label="New post" onPress={() => openEditor('new')} />
          </View>
        }
        ListEmptyComponent={
          posts.isPending ? (
            <LoadingState />
          ) : posts.isError ? (
            <ErrorState error={posts.error} onRetry={posts.refetch} />
          ) : (
            <EmptyState
              icon="megaphone"
              title="No posts yet"
              body="Share campus news, events, scholarships and deadlines with students."
            />
          )
        }
        renderItem={({ item, index }) => {
          const published = item.status === 'published';
          const stats = engagement.data?.[item.id];
          return (
            <LedgerRow
              first={index === 0}
              title={item.title}
              subtitle={item.body}
              onPress={() => (published ? openInsights(item.id) : openEditor(item.id))}>
              <View style={styles.metaLine}>
                <StatusBadge
                  label={published ? 'Published' : 'Draft'}
                  color={published ? colors.status.accepted : colors.status.draft}
                />
                <Text style={styles.meta}>
                  {POST_TYPE_LABELS[item.type]} ·{' '}
                  {item.published_at
                    ? `Published ${new Date(item.published_at).toLocaleDateString()}`
                    : `Edited ${new Date(item.updated_at).toLocaleDateString()}`}
                </Text>
              </View>
              {stats ? (
                <Text style={styles.meta}>
                  {plural(totalReactions(stats), 'reaction')} ·{' '}
                  {plural(stats.commentCount, 'comment')}
                </Text>
              ) : null}
            </LedgerRow>
          );
        }}
      />
    </View>
  );
}
