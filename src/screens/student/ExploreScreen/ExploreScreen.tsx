import { useState } from 'react';

import { CollegeCard } from '@/components/CollegeCard';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { SearchBar } from '@/components/SearchBar';
import { useQuery } from '@/hooks/useQuery';
import { getRecommendations } from '@/services';
import type { RecommendedCollege } from '@/types/models';

function matches(item: RecommendedCollege, query: string, region: string): boolean {
  if (region !== 'all' && item.college.region !== region) return false;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [item.college.name, item.college.location, ...item.college.programs.map((p) => p.name)];
  return haystack.some((text) => text.toLowerCase().includes(needle));
}

export function ExploreScreen() {
  // Recommendations already contain every college, ranked by AI match score.
  const colleges = useQuery(getRecommendations);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('all');

  return (
    <Screen>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search colleges or programs" />

      <QueryState query={colleges}>
        {(items) => {
          const regions: ChipOption<string>[] = [
            { value: 'all', label: 'All regions' },
            ...[...new Set(items.map((i) => i.college.region))].map((r) => ({ value: r, label: r })),
          ];
          const results = items.filter((item) => matches(item, query, region));

          return (
            <>
              <FilterChips options={regions} selected={region} onSelect={setRegion} />
              {results.length === 0 ? (
                <EmptyState
                  icon="search-outline"
                  title="No matches"
                  message="Try a different search or region."
                />
              ) : (
                results.map((item) => (
                  <CollegeCard key={item.college.id} college={item.college} matchScore={item.matchScore} />
                ))
              )}
            </>
          );
        }}
      </QueryState>
    </Screen>
  );
}
