import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { FilterTabs } from '@/components/FilterTabs';
import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { SearchField } from '@/components/SearchField';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { TickMeter } from '@/components/TickMeter';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { APPLICANT_FILTERS, firstOf, studentName, type ApplicantFilter } from '@/features/rep/api';
import { useApplicants } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createScreenStyles } from '@/screens/screenStyles';

const FILTER_LABELS: Record<ApplicantFilter, string> = {
  all: 'All',
  new: 'New',
  review: 'For review',
  resubmission: 'Resubmission',
  accepted: 'Accepted',
  rejected: 'Not admitted',
};

/** SDD screen 20 — applicant queue with the web dashboard's filters and counts. */
export function ApplicantsScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const [filter, setFilter] = useState<ApplicantFilter>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'fit'>('newest');
  const applicants = useApplicants();

  const all = applicants.data ?? [];
  const term = search.trim().toLowerCase();
  const visible = all
    .filter(APPLICANT_FILTERS[filter])
    .filter((a) => !term || studentName(a.student).toLowerCase().includes(term))
    .sort((a, b) =>
      sort === 'fit'
        ? (firstOf(b.ai_score)?.fit_score ?? -1) - (firstOf(a.ai_score)?.fit_score ?? -1)
        : (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''),
    );

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.listContent}
      data={visible}
      keyExtractor={(a) => a.id}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={applicants.isRefetching}
          onRefresh={applicants.refetch}
        />
      }
      ListHeaderComponent={
        <View style={[styles.section, styles.listHeader]}>
          <PageHeading title="Review queue" subtitle="Everyone who applied to your college." />
          <SearchField
            value={search}
            onChangeText={setSearch}
            placeholder="Search applicants"
            accessibilityLabel="Search applicants"
          />
          <FilterTabs<ApplicantFilter>
            value={filter}
            onChange={setFilter}
            options={(Object.keys(FILTER_LABELS) as ApplicantFilter[]).map((f) => ({
              value: f,
              label: FILTER_LABELS[f],
              count: all.filter(APPLICANT_FILTERS[f]).length,
            }))}
          />
          <FilterTabs<'newest' | 'fit'>
            value={sort}
            onChange={setSort}
            options={[
              { value: 'newest', label: 'Newest' },
              { value: 'fit', label: 'Best AI fit' },
            ]}
          />
        </View>
      }
      ListEmptyComponent={
        applicants.isPending ? (
          <LoadingState />
        ) : applicants.isError ? (
          <ErrorState error={applicants.error} onRetry={applicants.refetch} />
        ) : (
          <EmptyState
            icon="people"
            title={all.length ? 'No applicants in this filter' : 'No applications yet'}
            body={all.length ? undefined : 'Submitted applications will appear here.'}
          />
        )
      }
      renderItem={({ item, index }) => {
        const pending = item.documents.filter((d) => d.review_status === 'pending').length;
        const fit = firstOf(item.ai_score)?.fit_score;
        return (
          <LedgerRow
            first={index === 0}
            title={studentName(item.student)}
            subtitle={item.program?.name}
            onPress={() =>
              router.push({ pathname: '/rep/applicant/[id]', params: { id: item.id } })
            }
            accessibilityLabel={`${studentName(item.student)}, ${APPLICATION_STATUS_LABELS[item.status]}${fit !== undefined ? `, AI fit ${Math.round(fit)} percent` : ''}`}>
            <View style={styles.metaLine}>
              <StatusBadge
                label={APPLICATION_STATUS_LABELS[item.status]}
                color={applicationStatusColor(item.status, colors)}
              />
              <Text style={styles.meta}>
                {pending ? `${pending} to review · ` : ''}
                {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : ''}
              </Text>
            </View>
            {fit !== undefined ? (
              <View style={styles.fit}>
                <Text style={styles.meta}>{Math.round(fit)}% fit</Text>
                <TickMeter value={fit} label="AI fit" />
              </View>
            ) : null}
          </LedgerRow>
        );
      }}
    />
  );
}
