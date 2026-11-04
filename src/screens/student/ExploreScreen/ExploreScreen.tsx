import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

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

type Scope = 'all' | 'saved';

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

/** SDD screen 7 — search and filter published colleges, or just the saved ones. */
export function ExploreScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>('all');
  const deferredSearch = useDeferredValue(search);

  const colleges = useColleges({ search: deferredSearch, region });
  const followed = useFollowedColleges();
  const savedIds = new Set(followed.data ?? []);

  const all = colleges.data ?? [];
  const visible = scope === 'saved' ? all.filter((c) => savedIds.has(c.id)) : all;
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
          <View style={styles.filters}>
            <FilterTabs<Scope>
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: 'All' },
                { value: 'saved', label: 'Saved', count: savedIds.size },
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
        ) : scope === 'saved' && !filtering ? (
          <EmptyState
            icon="bookmark"
            title="No saved universities"
            body="Tap Save on a university to keep it here."
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
            savedIds.has(item.id) ? (
              <Icon name="bookmark-filled" size={18} color={colors.primary} />
            ) : undefined
          }
          onPress={() =>
            router.push({ pathname: '/student/college/[id]', params: { id: item.id } })
          }
          accessibilityLabel={`${item.name}, ${collegeLocation(item)}${savedIds.has(item.id) ? ', saved' : ''}`}>
          <View style={styles.deadline}>
            <DeadlineMark date={nextDeadline(item)} />
          </View>
        </LedgerRow>
      )}
    />
  );
}
