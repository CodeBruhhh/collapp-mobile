import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { CollegeLogo } from '@/components/CollegeLogo';
import { DeadlineMark } from '@/components/DeadlineMark';
import { Icon } from '@/components/Icon';
import { LedgerRow } from '@/components/LedgerRow';
import { MatchCard } from '@/components/MatchCard';
import { MetricPanel } from '@/components/MetricPanel';
import { MetricRows } from '@/components/MetricRow';
import { Notice } from '@/components/Notice';
import { PageHeading } from '@/components/PageHeading';
import { PostCard } from '@/components/PostCard';
import { Section } from '@/components/Section';
import { SyncBanner } from '@/components/SyncBanner';
import { useAuth } from '@/context/AuthContext';
import { usePlatformSettings } from '@/features/admin/hooks';
import { useRecommendations } from '@/features/ai/hooks';
import { useApplicationsWithLocal } from '@/features/applications/offline';
import { daysUntil } from '@/features/applications/status';
import { collegeLocation } from '@/features/colleges/api';
import { useColleges } from '@/features/colleges/hooks';
import { useFeed } from '@/features/feed/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './HomeScreen.styles';

const THIS_WEEK_DAYS = 7;

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
  const applied = apps.filter((a) => a.status !== 'draft').length;
  const inReview = apps.filter((a) =>
    ['submitted', 'under_review', 'action_required'].includes(a.status),
  ).length;
  const accepted = apps.filter((a) => a.status === 'accepted').length;
  const drafts = apps.filter((a) => a.status === 'draft');
  const actionRequired = apps.filter((a) => a.status === 'action_required');
  const firstName = profile?.full_name.split(' ')[0] ?? 'there';
  // Admin-picked colleges (platform_settings), in the admin's order; published only.
  const featured = (platform.data?.featured_college_ids ?? [])
    .map((id) => colleges.data?.find((c) => c.id === id))
    .filter((c) => c !== undefined);

  // The nearest deadline the student can still act on.
  const next = [...drafts, ...actionRequired]
    .flatMap((a) => {
      const days = daysUntil(a.program?.deadline);
      return days !== null && days >= 0 ? [{ program: a.program?.name, days }] : [];
    })
    .sort((a, b) => a.days - b.days)[0];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={applications.isRefetching || colleges.isRefetching || feed.isRefetching}
          onRefresh={() => {
            applications.refetch();
            colleges.refetch();
            recommendations.refetch();
            feed.refetch();
          }}
        />
      }>
      <View style={styles.overview}>
        <PageHeading
          title={`Hello, ${firstName}`}
          subtitle={
            next && next.days <= THIS_WEEK_DAYS
              ? 'A deadline is coming up this week.'
              : "Here's where your applications stand."
          }
        />

        <SyncBanner />

        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search universities"
          onPress={() => router.push('/student/explore')}
          style={styles.search}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <Text style={styles.searchText}>Search universities</Text>
        </Pressable>

        <View style={styles.totals}>
          {next ? (
            <MetricPanel
              label="Next deadline"
              value={next.days === 0 ? 'Today' : next.days}
              caption={
                next.days === 0
                  ? next.program
                  : `day${next.days === 1 ? '' : 's'} left${next.program ? ` · ${next.program}` : ''}`
              }
            />
          ) : (
            <MetricPanel label="Applications" value={applied} />
          )}
          <MetricRows
            metrics={[
              next
                ? { label: 'Applications', value: applied }
                : { label: 'Drafts', value: drafts.length },
              { label: 'In review', value: inReview },
              { label: 'Accepted', value: accepted },
            ]}
          />
        </View>

        {actionRequired.map((a) => (
          <Notice
            key={a.id}
            tone="danger"
            title="A document needs your attention"
            message={a.college?.name}
            onPress={() =>
              router.push({ pathname: '/student/application/[id]', params: { id: a.id } })
            }
          />
        ))}
      </View>

      {featured.length ? (
        <View style={styles.featured}>
          <Text accessibilityRole="header" style={styles.featuredTitle}>
            Featured universities
          </Text>
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
                style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}>
                <CollegeLogo name={c.name} logoPath={c.logo_path} size={44} />
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

      {drafts.length ? (
        <Section title="Finish your drafts">
          {drafts.map((a) => (
            <LedgerRow
              key={a.id}
              title={a.college?.name ?? ''}
              subtitle={a.program?.name}
              onPress={() =>
                router.push({
                  pathname: '/student/apply/[collegeId]',
                  params: { collegeId: a.college_id },
                })
              }>
              <DeadlineMark date={a.program?.deadline} />
            </LedgerRow>
          ))}
        </Section>
      ) : null}

      <Section
        band
        title="Recommended for you"
        trailing={{ label: 'See all', onPress: () => router.push('/student/recommendations') }}>
        {recommendations.isPending || recommendations.refresh.isPending ? (
          <Text style={styles.status}>Finding programs that match your profile…</Text>
        ) : recommendations.data?.length ? (
          recommendations.data.slice(0, 3).map((r) => <MatchCard key={r.id} recommendation={r} />)
        ) : (
          // No matches yet: fall back to browsing.
          (colleges.data ?? [])
            .slice(0, 3)
            .map((c) => (
              <LedgerRow
                key={c.id}
                title={c.name}
                subtitle={collegeLocation(c)}
                leading={<CollegeLogo name={c.name} logoPath={c.logo_path} size={40} />}
                onPress={() =>
                  router.push({ pathname: '/student/college/[id]', params: { id: c.id } })
                }
              />
            ))
        )}
      </Section>

      <Section title="Campus updates">
        {feed.data?.length ? (
          feed.data.slice(0, 15).map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <Text style={styles.status}>
            {feed.isPending
              ? 'Loading updates…'
              : 'News, events and scholarships from colleges will appear here.'}
          </Text>
        )}
      </Section>
    </ScrollView>
  );
}
