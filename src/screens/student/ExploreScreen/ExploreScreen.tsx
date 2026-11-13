import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { CollegeLogo } from '@/components/CollegeLogo';
import { DeadlineMark } from '@/components/DeadlineMark';
import { FilterTabs } from '@/components/FilterTabs';
import { Icon } from '@/components/Icon';
import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { SearchField } from '@/components/SearchField';
import { Select } from '@/components/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { PH_REGIONS } from '@/data/ph-address';
import { collegeLocation, type CollegeListItem } from '@/features/colleges/api';
import { useColleges, useFollowedColleges } from '@/features/colleges/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ExploreScreen.styles';

const ALL_REGIONS = 'All regions';
const REGION_OPTIONS = [ALL_REGIONS, ...PH_REGIONS.map((r) => r.region_name)];

type Scope = 'all' | 'following';

/** Earliest open-program deadline that hasn't passed yet. */
function nextDeadline(college: CollegeListItem): string | null {
  const today = new Date().toISOString().slice(0, 10);
  return (
    college.programs
      .filter((p) => p.is_open && p.deadline && p.deadline >= today)
      .map((p) => p.deadline!)
      .sort()[0] ?? null
  );
}

/** SDD screen 7 — search and filter published colleges, or just the followed ones. */
export function ExploreScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>('all');
  const deferredSearch = useDeferredValue(search);

  const colleges = useColleges({ search: deferredSearch, region });
  const followed = useFollowedColleges();
  const followedIds = new Set(followed.data ?? []);

  const all = colleges.data ?? [];
  const visible = scope === 'following' ? all.filter((c) => followedIds.has(c.id)) : all;
  const filtering = Boolean(search.trim() || region);

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(c) => c.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={colleges.isRefetching}
          onRefresh={colleges.refetch}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <PageHeading title="Find your university" />
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search universities"
            accessibilityLabel="Search universities"
          />
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/student/feed')}
            style={({ pressed }) => [styles.feedEntry, pressed && styles.feedEntryPressed]}>
            <View style={styles.feedIcon}>
              <Icon name="megaphone" size={20} color={colors.onPrimary} />
            </View>
            <View style={styles.feedText}>
              <Text style={styles.feedTitle}>Campus feed</Text>
              <Text style={styles.feedSubtitle}>
                {followedIds.size
                  ? `Updates from ${followedIds.size} ${followedIds.size === 1 ? 'university' : 'universities'} you follow`
                  : 'News, events and scholarships'}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
          <View style={styles.filters}>
            <FilterTabs<Scope>
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: 'All' },
                { value: 'following', label: 'Following', count: followedIds.size },
              ]}
            />
            <Select
              label="Region"
              hideLabel
              value={region ?? ALL_REGIONS}
              options={REGION_OPTIONS}
              onChange={(v) => setRegion(v === ALL_REGIONS ? null : v)}
            />
          </View>
          {filtering && colleges.data ? (
            <Text style={styles.count}>
              {visible.length} {visible.length === 1 ? 'result' : 'results'}
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        colleges.isPending ? (
          <LoadingState />
        ) : colleges.isError ? (
          <ErrorState error={colleges.error} onRetry={colleges.refetch} />
        ) : scope === 'following' && !filtering ? (
          <EmptyState
            icon="school"
            title="Not following anyone yet"
            body="Tap Follow on a university to keep it here and see its posts in your feed."
            actionLabel="Browse all"
            onAction={() => setScope('all')}
          />
        ) : (
          <EmptyState icon="school" title="No matches" body="Try another name or region." />
        )
      }
      renderItem={({ item, index }) => (
        <LedgerRow
          first={index === 0}
          title={item.name}
          subtitle={`${collegeLocation(item)} · ${item.programs.length} program${item.programs.length === 1 ? '' : 's'}`}
          leading={<CollegeLogo name={item.name} logoPath={item.logo_path} size={44} />}
          trailing={
            followedIds.has(item.id) ? (
              <Text style={styles.followingMark}>Following</Text>
            ) : undefined
          }
          onPress={() =>
            router.push({ pathname: '/student/college/[id]', params: { id: item.id } })
          }
          accessibilityLabel={`${item.name}, ${collegeLocation(item)}${followedIds.has(item.id) ? ', following' : ''}`}>
          <View style={styles.deadline}>
            <DeadlineMark date={nextDeadline(item)} />
          </View>
        </LedgerRow>
      )}
    />
  );
}
