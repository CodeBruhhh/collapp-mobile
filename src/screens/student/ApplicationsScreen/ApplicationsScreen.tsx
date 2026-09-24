import { useState } from 'react';

import { ApplicationCard } from '@/components/ApplicationCard';
import { EmptyState } from '@/components/EmptyState';
import { FilterChips, type ChipOption } from '@/components/FilterChips';
import { QueryState } from '@/components/QueryState';
import { Screen } from '@/components/Screen';
import { STATUS_META, STATUS_ORDER } from '@/constants/applicationStatus';
import { useQuery } from '@/hooks/useQuery';
import { listApplications } from '@/services';
import type { ApplicationStatus } from '@/types/models';

type Filter = 'all' | ApplicationStatus;

const FILTERS: ChipOption<Filter>[] = [
  { value: 'all', label: 'All' },
  ...STATUS_ORDER.map((status) => ({ value: status, label: STATUS_META[status].label })),
];

export function ApplicationsScreen() {
  const applications = useQuery(listApplications);
  const [filter, setFilter] = useState<Filter>('all');

  return (
    <Screen>
      <FilterChips options={FILTERS} selected={filter} onSelect={setFilter} />

      <QueryState query={applications}>
        {(items) => {
          const visible = items
            .filter((a) => filter === 'all' || a.status === filter)
            // Things that need attention first, then by soonest deadline.
            .sort(
              (a, b) =>
                STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) ||
                a.program.deadline.localeCompare(b.program.deadline),
            );

          if (visible.length === 0) {
            return (
              <EmptyState
                icon="document-text-outline"
                title="No applications here"
                message="Applications with this status will show up in this list."
              />
            );
          }
          return visible.map((a) => <ApplicationCard key={a.id} application={a} />);
        }}
      </QueryState>
    </Screen>
  );
}
