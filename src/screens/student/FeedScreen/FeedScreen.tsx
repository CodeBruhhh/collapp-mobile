import { Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { FollowButton } from '@/components/FollowButton';
import { LedgerRow } from '@/components/LedgerRow';
import { Notice } from '@/components/Notice';
import { PostCard } from '@/components/PostCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useRecommendations } from '@/features/ai/hooks';
import { collegeLocation } from '@/features/colleges/api';
import { useColleges } from '@/features/colleges/hooks';
import { useEngagement, useFeed, useFollowingFeed } from '@/features/feed/hooks';
import { useIsOnline } from '@/hooks/useIsOnline';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './FeedScreen.styles';

type Tab = 'following' | 'for-you';

const SUGGESTIONS = 5;

/** Universities to follow when the feed is empty: best AI matches, then any. */
function useSuggestedColleges() {
  const recommendations = useRecommendations();
  const colleges = useColleges({});
  const matched = (recommendations.data ?? []).flatMap((r) => (r.college ? [r.college.id] : []));
  const all = colleges.data ?? [];
  const ranked = [
    ...matched.flatMap((id) => all.filter((c) => c.id === id)),
    ...all.filter((c) => !matched.includes(c.id)),
  ];
  return ranked.filter((c, i) => ranked.indexOf(c) === i).slice(0, SUGGESTIONS);
}

/** Every post from followed universities, plus a ranked "For you" tab for discovery. */
export function FeedScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [tab, setTab] = useState<Tab>('following');
  const online = useIsOnline();

  const following = useFollowingFeed();
  const forYou = useFeed();
  const suggested = useSuggestedColleges();

  const onFollowing = tab === 'following';
  const followsNobody = following.followed.data?.length === 0;
  const posts = (onFollowing ? following.data : forYou.data) ?? [];
  const engagement = useEngagement(posts.map((p) => p.id));

  const loading = onFollowing
    ? following.followed.isPending || (!followsNobody && following.isPending)
    : forYou.isPending;
  const failed = onFollowing ? (following.followed.error ?? following.error) : forYou.error;
  const refreshing = onFollowing ? following.isRefetching : forYou.isRefetching;

  function refresh() {
    engagement.refetch();
    if (onFollowing) {
      following.followed.refetch();
      following.refetch();
    } else {
      forYou.refetch();
    }
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Campus feed' }} />
      <View style={styles.tabs}>
        <FilterTabs<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'following', label: 'Following' },
            { value: 'for-you', label: 'For you' },
          ]}
        />
      </View>
      {!online ? (
        <View style={styles.notice}>
          <Notice icon="cloud-offline" title="You're offline. Showing saved posts." />
        </View>
      ) : null}
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            tintColor={colors.primary}
            colors={[colors.primary]}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (onFollowing && following.hasNextPage && !following.isFetchingNextPage) {
            following.fetchNextPage();
          }
        }}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : failed ? (
            <ErrorState error={failed} onRetry={refresh} />
          ) : onFollowing && followsNobody ? (
            <View>
              <EmptyState
                icon="megaphone"
                title="Your feed is empty"
                body="Follow a university to see its news, events and scholarships here."
              />
              <View style={styles.suggestions}>
                <Text accessibilityRole="header" style={styles.heading}>
                  Suggested for you
                </Text>
                {suggested.map((c, index) => (
                  <LedgerRow
                    key={c.id}
                    first={index === 0}
                    title={c.name}
                    subtitle={collegeLocation(c)}
                    leading={<CollegeLogo name={c.name} logoPath={c.logo_path} size={40} />}
                    trailing={<FollowButton collegeId={c.id} collegeName={c.name} />}
                  />
                ))}
              </View>
            </View>
          ) : (
            <EmptyState
              icon="megaphone"
              title="No posts yet"
              body={
                onFollowing
                  ? 'Universities you follow have not posted anything yet.'
                  : 'News, events and scholarships from colleges will appear here.'
              }
            />
          )
        }
        renderItem={({ item }) => (
          <PostCard post={item} engagement={engagement.data?.[item.id]} showFollow={!onFollowing} />
        )}
      />
    </View>
  );
}
