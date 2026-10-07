import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';

import { Card } from '@/components/Card';
import { FilterTabs } from '@/components/FilterTabs';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { APPLICANT_FILTERS, studentName, type ApplicantFilter } from '@/features/rep/api';
import { useApplicants } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createRepStyles } from '../repStyles';

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
  const styles = createRepStyles(colors);
  const [filter, setFilter] = useState<ApplicantFilter>('all');
  const [search, setSearch] = useState('');
  const applicants = useApplicants();

  const all = applicants.data ?? [];
  const term = search.trim().toLowerCase();
  const visible = all
    .filter(APPLICANT_FILTERS[filter])
    .filter((a) => !term || studentName(a.student).toLowerCase().includes(term));

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(a) => a.id}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={applicants.isRefetching} onRefresh={applicants.refetch} />
      }
      ListHeaderComponent={
        <View style={styles.section}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search applicants"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Search applicants"
              style={styles.searchInput}
            />
          </View>
          <FilterTabs<ApplicantFilter>
            value={filter}
            onChange={setFilter}
            options={(Object.keys(FILTER_LABELS) as ApplicantFilter[]).map((f) => ({
              value: f,
              label: FILTER_LABELS[f],
              count: all.filter(APPLICANT_FILTERS[f]).length,
            }))}
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
            icon="people-outline"
            title={all.length ? 'No applicants in this filter' : 'No applications yet'}
            body={all.length ? undefined : 'Submitted applications will appear here.'}
          />
        )
      }
      renderItem={({ item }) => {
        const pending = item.documents.filter((d) => d.review_status === 'pending').length;
        return (
          <Card
            onPress={() =>
              router.push({ pathname: '/rep/applicant/[id]', params: { id: item.id } })
            }
            accessibilityLabel={`${studentName(item.student)}, ${APPLICATION_STATUS_LABELS[item.status]}`}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{studentName(item.student)}</Text>
                <Text style={styles.meta}>{item.program?.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <View style={styles.rowBetween}>
              <StatusBadge
                label={APPLICATION_STATUS_LABELS[item.status]}
                color={applicationStatusColor(item.status, colors)}
              />
              <Text style={styles.meta}>
                {pending ? `${pending} to review · ` : ''}
                {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : ''}
              </Text>
            </View>
          </Card>
        );
      }}
    />
  );
}
