import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { MatchCard } from '@/components/MatchCard';
import { PostCard } from '@/components/PostCard';
import { SyncBanner } from '@/components/SyncBanner';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/features/admin/hooks';
import { useRecommendations } from '@/features/ai/hooks';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { collegeLocation } from '@/features/colleges/api';
import { useColleges } from '@/features/colleges/hooks';
import { useFeed } from '@/features/feed/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './HomeScreen.styles';

/**
 * SDD screen 6 — greeting, application summary (web dashboard stat cards),
 * AI-recommended programs and the algorithmic campus feed (SRS 3.1.1.2, 3.1.2.3).
 */
export function HomeScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { profile } = useAuth();
  const applications = useApplicationsWithLocal();
  const colleges = useColleges({});
  const recommendations = useRecommendations();
  const feed = useFeed();
  const platform = usePlatformSettings();

  const apps = applications.data ?? [];
  const stats = [
    { label: 'Applications', value: apps.filter((a) => a.status !== 'draft').length },
    {
      label: 'In review',
      value: apps.filter((a) => ['submitted', 'under_review', 'action_required'].includes(a.status))
        .length,
    },
    { label: 'Accepted', value: apps.filter((a) => a.status === 'accepted').length },
  ];
  const drafts = apps.filter((a) => a.status === 'draft');
  const actionRequired = apps.filter((a) => a.status === 'action_required');
  const firstName = profile?.full_name.split(' ')[0] ?? 'there';
  // Admin-picked colleges (platform_settings), in the admin's order; published only.
  const featured = (platform.data?.featured_college_ids ?? [])
    .map((id) => colleges.data?.find((c) => c.id === id))
    .filter((c) => c !== undefined);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={applications.isRefetching || colleges.isRefetching || feed.isRefetching}
          onRefresh={() => {
            applications.refetch();
            colleges.refetch();
            recommendations.refetch();
            feed.refetch();
          }}
        />
      }>
      <View>
        <Text accessibilityRole="header" style={styles.greeting}>
          Hello, {firstName}
        </Text>
        <Text style={styles.meta}>Explore. Plan. Build your future.</Text>
      </View>

      <SyncBanner />

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search universities"
        onPress={() => router.push('/student/explore')}
        style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <Text style={styles.searchText}>Search universities, programs or locations</Text>
      </Pressable>

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat} accessibilityLabel={`${s.label}: ${s.value}`}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {featured.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured universities</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}>
            {featured.map((c) => (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`${c.name}, ${collegeLocation(c)}`}
                onPress={() =>
                  router.push({ pathname: '/student/college/[id]', params: { id: c.id } })
                }
                style={styles.featuredCard}>
                <CollegeLogo name={c.name} logoPath={c.logo_path} size={48} />
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {c.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {collegeLocation(c)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {actionRequired.map((a) => (
        <Card
          key={a.id}
          style={{ borderColor: colors.status.actionRequired }}
          onPress={() =>
            router.push({ pathname: '/student/application/[id]', params: { id: a.id } })
          }>
          <Text style={styles.cardTitle}>Action required · {a.college?.name}</Text>
          <Text style={styles.meta}>A document needs to be resubmitted.</Text>
        </Card>
      ))}

      {drafts.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finish your drafts</Text>
          {drafts.map((a) => (
            <Card
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: '/student/apply/[collegeId]',
                  params: { collegeId: a.college_id },
                })
              }>
              <Text style={styles.cardTitle}>{a.college?.name}</Text>
              <Text style={styles.meta}>{a.program?.name}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/student/recommendations')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {recommendations.isPending || recommendations.refresh.isPending ? (
          <Text style={styles.meta}>Finding programs that match your profile…</Text>
        ) : recommendations.data?.length ? (
          recommendations.data.slice(0, 3).map((r) => <MatchCard key={r.id} recommendation={r} />)
        ) : (
          // No matches yet: fall back to browsing.
          (colleges.data ?? []).slice(0, 3).map((c) => (
            <Card
              key={c.id}
              onPress={() =>
                router.push({ pathname: '/student/college/[id]', params: { id: c.id } })
              }>
              <View style={styles.row}>
                <CollegeLogo name={c.name} logoPath={c.logo_path} size={40} />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{c.name}</Text>
                  <Text style={styles.meta}>{collegeLocation(c)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </Card>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campus updates</Text>
        {feed.data?.length ? (
          feed.data.slice(0, 15).map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <Text style={styles.meta}>
            {feed.isPending
              ? 'Loading updates…'
              : 'News, events and scholarships from colleges will appear here.'}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
