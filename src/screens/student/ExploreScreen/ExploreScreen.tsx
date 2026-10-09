import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { Select } from '@/components/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { PH_REGIONS } from '@/data/ph-address';
import { collegeLocation, type CollegeListItem } from '@/features/colleges/api';
import { useColleges, useFollowedColleges } from '@/features/colleges/hooks';
import { deadlineLabel } from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ExploreScreen.styles';

const ALL_REGIONS = 'All regions';
const REGION_OPTIONS = [ALL_REGIONS, ...PH_REGIONS.map((r) => r.region_name)];

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

/** SDD screen 7 — search and filter published colleges (web: Browse Colleges). */
export function ExploreScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const colleges = useColleges({ search: deferredSearch, region });
  const followed = useFollowedColleges();
  const followedIds = new Set(followed.data ?? []);

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={colleges.data ?? []}
      keyExtractor={(c) => c.id}
      keyboardShouldPersistTaps="handled"
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
          </View>
          <Select
            label="Region"
            value={region ?? ALL_REGIONS}
            options={REGION_OPTIONS}
            onChange={(v) => setRegion(v === ALL_REGIONS ? null : v)}
          />
          {colleges.data ? (
            <Text style={styles.count}>
              {colleges.data.length} {colleges.data.length === 1 ? 'university' : 'universities'}{' '}
              found
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        colleges.isPending ? (
          <LoadingState />
        ) : colleges.isError ? (
          <ErrorState error={colleges.error} onRetry={colleges.refetch} />
        ) : (
          <EmptyState
            icon="school-outline"
            title="No universities match"
            body="Try a different name or region."
          />
        )
      }
      renderItem={({ item }) => {
        const deadline = nextDeadline(item);
        return (
          <Card
            onPress={() =>
              router.push({ pathname: '/student/college/[id]', params: { id: item.id } })
            }
            accessibilityLabel={`${item.name}, ${collegeLocation(item)}`}>
            <View style={styles.row}>
              <CollegeLogo name={item.name} logoPath={item.logo_path} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  <Ionicons name="location-outline" size={13} /> {collegeLocation(item)}
                </Text>
                <Text style={styles.meta}>
                  {item.programs.length} program{item.programs.length === 1 ? '' : 's'}
                  {deadline ? ` · Next deadline ${deadline} (${deadlineLabel(deadline)})` : ''}
                </Text>
              </View>
              {followedIds.has(item.id) ? (
                <Ionicons
                  name="bookmark"
                  size={20}
                  color={colors.primary}
                  accessibilityLabel="Saved"
                />
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              )}
            </View>
          </Card>
        );
      }}
    />
  );
}
