import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import type { MyApplication } from '@/features/applications/api';
import { useMyApplications } from '@/features/applications/hooks';
import {
  APPLICATION_STATUS_LABELS,
  applicationProgress,
  applicationStatusColor,
  deadlineLabel,
} from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ApplicationsScreen.styles';

type Filter = 'all' | 'draft' | 'in_progress' | 'action_required' | 'decided';

const MATCHES: Record<Filter, (a: MyApplication) => boolean> = {
  all: () => true,
  draft: (a) => a.status === 'draft',
  in_progress: (a) => a.status === 'submitted' || a.status === 'under_review',
  action_required: (a) => a.status === 'action_required',
  decided: (a) => a.status === 'accepted' || a.status === 'rejected',
};

function openApplication(app: MyApplication) {
  if (app.status === 'draft') {
    router.push({ pathname: '/student/apply/[collegeId]', params: { collegeId: app.college_id } });
  } else {
    router.push({ pathname: '/student/application/[id]', params: { id: app.id } });
  }
}

/** SDD screen 13 — every application with its milestone badge, progress and deadline. */
export function ApplicationsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [filter, setFilter] = useState<Filter>('all');
  const applications = useMyApplications();

  const all = applications.data ?? [];
  const visible = all.filter(MATCHES[filter]);
  const decided = all.filter(MATCHES.decided).length;
  const count = (f: Filter) => all.filter(MATCHES[f]).length;

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(a) => a.id}
      refreshControl={
        <RefreshControl refreshing={applications.isRefetching} onRefresh={applications.refetch} />
      }
      ListHeaderComponent={
        all.length ? (
          <View style={styles.header}>
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.title}>Overall progress</Text>
                <Text style={styles.meta}>
                  {decided} of {all.length} decided
                </Text>
              </View>
              <ProgressBar value={all.length ? decided / all.length : 0} />
            </Card>
            <FilterTabs<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All', count: all.length },
                { value: 'draft', label: 'Drafts', count: count('draft') },
                { value: 'in_progress', label: 'In review', count: count('in_progress') },
                {
                  value: 'action_required',
                  label: 'Action required',
                  count: count('action_required'),
                },
                { value: 'decided', label: 'Decided', count: decided },
              ]}
            />
          </View>
        ) : null
      }
      ListEmptyComponent={
        applications.isPending ? (
          <LoadingState />
        ) : applications.isError ? (
          <ErrorState error={applications.error} onRetry={applications.refetch} />
        ) : all.length ? (
          <EmptyState icon="filter-outline" title="Nothing in this filter" />
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No applications yet"
            body="Find a university you like and apply in a few steps."
            actionLabel="Explore universities"
            onAction={() => router.push('/student/explore')}
          />
        )
      }
      renderItem={({ item }) => {
        const color = applicationStatusColor(item.status, colors);
        const deadline = item.status === 'draft' ? deadlineLabel(item.program?.deadline) : null;
        return (
          <Card
            onPress={() => openApplication(item)}
            accessibilityLabel={`${item.college?.name}, ${APPLICATION_STATUS_LABELS[item.status]}`}>
            <View style={styles.row}>
              <CollegeLogo name={item.college?.name ?? ''} logoPath={item.college?.logo_path} />
              <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.college?.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.program?.name}
                </Text>
              </View>
            </View>
            <StatusBadge label={APPLICATION_STATUS_LABELS[item.status]} color={color} />
            <ProgressBar
              value={applicationProgress(item.status)}
              color={color}
              accessibilityLabel="Application progress"
            />
            {deadline ? (
              <Text style={styles.meta}>
                Deadline {item.program?.deadline} · {deadline}
              </Text>
            ) : null}
          </Card>
        );
      }}
    />
  );
}
