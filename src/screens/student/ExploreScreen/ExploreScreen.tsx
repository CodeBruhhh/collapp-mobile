import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { Select } from '@/components/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { PH_REGIONS } from '@/data/ph-address';
import { deadlineLabel } from '@/features/applications/status';
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
        <RefreshControl refreshing={colleges.isRefetching} onRefresh={colleges.refetch} />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search universities"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Search universities"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch('')}
                hitSlop={8}
                style={styles.clear}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
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
            icon="bookmark-outline"
            title="No saved universities"
            body="Tap Save on a university to keep it here."
            actionLabel="Browse all"
            onAction={() => setScope('all')}
          />
        ) : (
          <EmptyState icon="school-outline" title="No matches" body="Try another name or region." />
        )
      }
      renderItem={({ item }) => {
        const deadline = nextDeadline(item);
        const programs = `${item.programs.length} program${item.programs.length === 1 ? '' : 's'}`;
        return (
          <Card
            onPress={() =>
              router.push({ pathname: '/student/college/[id]', params: { id: item.id } })
            }
            accessibilityLabel={`${item.name}, ${collegeLocation(item)}${savedIds.has(item.id) ? ', saved' : ''}`}>
            <View style={styles.row}>
              <CollegeLogo name={item.name} logoPath={item.logo_path} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {collegeLocation(item)}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {deadline ? `${programs} · ${deadlineLabel(deadline)}` : programs}
                </Text>
              </View>
              {savedIds.has(item.id) ? (
                <Ionicons name="bookmark" size={18} color={colors.primary} />
              ) : null}
            </View>
          </Card>
        );
      }}
    />
  );
}
