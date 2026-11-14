import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { FilterTabs } from '@/components/FilterTabs';
import { LedgerRow } from '@/components/LedgerRow';
import { Notice } from '@/components/Notice';
import { OptionPill } from '@/components/OptionPill';
import { PageHeading } from '@/components/PageHeading';
import { SearchField } from '@/components/SearchField';
import { Select } from '@/components/Select';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { TickMeter } from '@/components/TickMeter';
import { useAuth } from '@/context/AuthContext';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { studentName, type ApplicantFilter } from '@/features/rep/api';
import {
  useMyCollege,
  useProgramSeats,
  useQueueCounts,
  useReviewers,
  useReviewQueue,
  useStagedDecisions,
} from '@/features/rep/hooks';
import {
  DEFAULT_QUEUE_FILTERS,
  seatsLeft,
  type QueueFilters,
  type QueueItem,
  type QueueSort,
  type QueueView,
} from '@/features/rep/queue';
import { startReviewSession } from '@/features/rep/reviewSession';
import { useTheme } from '@/hooks/useTheme';

import { createScreenStyles } from '@/screens/screenStyles';

import { createStyles } from './ApplicantsScreen.styles';
import { ReleaseSheet } from './ReleaseSheet';

const FILTER_LABELS: Record<ApplicantFilter, string> = {
  all: 'All',
  new: 'New',
  review: 'For review',
  resubmission: 'Resubmission',
  accepted: 'Accepted',
  rejected: 'Not admitted',
};

const VIEWS: { key: QueueView; label: string; hint: string }[] = [
  { key: 'ready', label: 'Ready to decide', hint: 'Every document approved' },
  { key: 'missing', label: 'Missing documents', hint: 'A file is missing or sent back' },
  { key: 'flagged', label: 'Flagged by AI', hint: 'The AI check found something to look at' },
  { key: 'waiting', label: 'Waiting 7+ days', hint: 'Submitted over a week ago, not decided' },
];

const SORTS: Record<QueueSort, { label: string; hint: string }> = {
  newest: { label: 'Newest first', hint: 'Latest submissions at the top' },
  oldest: { label: 'Oldest first', hint: 'First come, first reviewed' },
  fit: { label: 'Best AI fit', hint: 'Highest fit score at the top' },
  name: { label: 'Name A to Z', hint: 'Alphabetical by student' },
};

const ALL_PROGRAMS = 'All programs';
const ANYONE = 'Anyone';
const MINE = 'Assigned to me';
const UNASSIGNED = 'Unassigned';
const SEARCH_DELAY_MS = 300;

/** SDD screen 20 — the applicant queue, paged from the server for busy seasons. */
export function ApplicantsScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const local = createStyles(colors);
  const userId = useAuth().session?.user.id ?? '';

  const [filters, setFilters] = useState<QueueFilters>(DEFAULT_QUEUE_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [sorting, setSorting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const set = (changes: Partial<QueueFilters>) => setFilters((f) => ({ ...f, ...changes }));

  // Ask the server once typing pauses, not on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => (f.search === searchText ? f : { ...f, search: searchText }));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const queue = useReviewQueue(filters);
  const counts = useQueueCounts({
    programId: filters.programId,
    assignee: filters.assignee,
    search: filters.search,
    view: filters.view,
  });
  const staged = useStagedDecisions();
  const college = useMyCollege();
  const reviewers = useReviewers();
  const seats = useProgramSeats();
  const held = staged.data ?? [];
  const releaseAt = college.data?.results_release_at ?? null;

  const rows = queue.data?.pages.flatMap((p) => p.rows) ?? [];
  const total = queue.data?.pages[0]?.total ?? 0;
  const everyone = counts.data ? counts.data.status.all : null;

  const programs = college.data?.programs ?? [];
  const program = programs.find((p) => p.id === filters.programId) ?? null;
  const programSeats = program ? seats.data?.get(program.id) : undefined;
  const openSeats = seatsLeft(programSeats);

  const others = (reviewers.data ?? []).filter((r) => r.id !== userId);
  const reviewerName = (id: string | null) =>
    !id
      ? null
      : id === userId
        ? 'You'
        : (reviewers.data?.find((r) => r.id === id)?.full_name ?? null);
  const assigneeLabel =
    filters.assignee === null
      ? ANYONE
      : filters.assignee === 'me'
        ? MINE
        : filters.assignee === 'none'
          ? UNASSIGNED
          : (reviewerName(filters.assignee) ?? ANYONE);

  const shortlisting = filters.shortlist !== null;
  const filtered =
    filters.programId !== null ||
    filters.assignee !== null ||
    filters.view !== null ||
    filters.status !== 'all' ||
    Boolean(filters.search) ||
    shortlisting;

  function clearFilters() {
    setSearchText('');
    setFilters((f) => ({ ...DEFAULT_QUEUE_FILTERS, sort: f.sort }));
  }

  function open(item: QueueItem, index: number) {
    startReviewSession(filters, index, item.id);
    router.push({ pathname: '/rep/applicant/[id]', params: { id: item.id } });
  }

  return (
    <>
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.listContent}
        data={rows}
        keyExtractor={(a) => a.id}
        keyboardShouldPersistTaps="handled"
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (queue.hasNextPage && !queue.isFetchingNextPage) queue.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            tintColor={colors.primary}
            colors={[colors.primary]}
            refreshing={queue.isRefetching && !queue.isFetchingNextPage}
            onRefresh={() => {
              queue.refetch();
              counts.refetch();
              seats.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={local.header}>
            <PageHeading title="Review queue" subtitle="Everyone who applied to your college." />
            {held.length || releaseAt ? (
              <Notice
                icon={releaseAt ? 'alarm' : 'checkmark-done'}
                title={`${held.length} decision${held.length === 1 ? '' : 's'} held for release`}
                message={
                  releaseAt
                    ? `Goes out ${new Date(releaseAt).toLocaleString()}`
                    : 'Students are not told until you release them.'
                }
                onPress={() => setReleasing(true)}
              />
            ) : null}

            {/* Find and narrow: search, then the list's options as compact pills. */}
            <View style={local.controls}>
              <SearchField
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search by student name"
                accessibilityLabel="Search applicants"
              />
              <View style={local.toolbar}>
                {programs.length > 1 ? (
                  <Select
                    variant="pill"
                    label="Program"
                    value={program?.name ?? ALL_PROGRAMS}
                    active={program !== null}
                    options={[ALL_PROGRAMS, ...programs.map((p) => p.name)]}
                    onChange={(name) =>
                      set({
                        programId: programs.find((p) => p.name === name)?.id ?? null,
                        shortlist: null,
                      })
                    }
                  />
                ) : null}
                {others.length ? (
                  <Select
                    variant="pill"
                    label="Reviewer"
                    value={assigneeLabel}
                    active={filters.assignee !== null}
                    options={[ANYONE, MINE, UNASSIGNED, ...others.map((r) => r.full_name)]}
                    onChange={(label) =>
                      set({
                        assignee:
                          label === ANYONE
                            ? null
                            : label === MINE
                              ? 'me'
                              : label === UNASSIGNED
                                ? 'none'
                                : (others.find((r) => r.full_name === label)?.id ?? null),
                      })
                    }
                  />
                ) : (
                  // A rep on their own still gets "mine vs unassigned" once others join.
                  <OptionPill
                    label="Reviewer"
                    value={filters.assignee === 'me' ? MINE : ANYONE}
                    active={filters.assignee === 'me'}
                    onPress={() => set({ assignee: filters.assignee === 'me' ? null : 'me' })}
                  />
                )}
                {!shortlisting ? (
                  <OptionPill
                    label="Sort"
                    value={SORTS[filters.sort].label}
                    active={filters.sort !== 'newest'}
                    onPress={() => setSorting(true)}
                  />
                ) : null}
              </View>
            </View>

            {program && programSeats?.slots != null ? (
              <SeatPanel
                programName={program.name}
                slots={programSeats.slots}
                admitted={programSeats.admitted}
                held={programSeats.held}
                shortlisting={shortlisting}
                onShortlist={
                  openSeats && openSeats > 0
                    ? () => set({ shortlist: shortlisting ? null : openSeats })
                    : undefined
                }
              />
            ) : null}

            {shortlisting ? (
              <Notice
                icon="sparkles"
                title={`Top ${filters.shortlist} undecided by AI fit`}
                message={`One for each open seat in ${program?.name ?? 'this program'}. Tap to leave the shortlist.`}
                onPress={() => set({ shortlist: null })}
              />
            ) : (
              <>
                {/* Ready-made slices of the queue; tap again to turn one off. */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={local.views}>
                  {VIEWS.map(({ key, label, hint }) => {
                    const active = filters.view === key;
                    const count = counts.data?.views[key];
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityHint={hint}
                        onPress={() => set({ view: active ? null : key, status: 'all' })}
                        style={[local.view, active && local.viewActive]}>
                        <Text style={[local.viewLabel, active && local.viewLabelActive]}>
                          {label}
                        </Text>
                        {count !== undefined ? (
                          <Text style={[local.viewCount, active && local.viewLabelActive]}>
                            {count}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {/* Status is the queue's main split, so it gets the ruled tab strip. */}
                <View style={local.tabStrip}>
                  <FilterTabs<ApplicantFilter>
                    value={filters.status}
                    onChange={(status) => set({ status })}
                    options={(Object.keys(FILTER_LABELS) as ApplicantFilter[]).map((f) => ({
                      value: f,
                      label: FILTER_LABELS[f],
                      count: counts.data?.status[f],
                    }))}
                  />
                </View>
              </>
            )}

            {queue.data ? (
              <View style={local.resultLine}>
                <Text style={styles.tally} accessibilityLiveRegion="polite">
                  {filtered && everyone !== null
                    ? `Showing ${total} of ${everyone}`
                    : `${total} applicant${total === 1 ? '' : 's'}`}
                </Text>
                {filtered ? (
                  <Pressable accessibilityRole="button" hitSlop={12} onPress={clearFilters}>
                    <Text style={local.clear}>Clear filters</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          queue.isPending ? (
            <LoadingState />
          ) : queue.isError ? (
            <ErrorState error={queue.error} onRetry={queue.refetch} />
          ) : (
            <EmptyState
              icon="people"
              title={filtered ? 'No applicants match these filters' : 'No applications yet'}
              body={filtered ? undefined : 'Submitted applications will appear here.'}
              actionLabel={filtered ? 'Clear filters' : undefined}
              onAction={filtered ? clearFilters : undefined}
            />
          )
        }
        ListFooterComponent={
          queue.isFetchingNextPage ? (
            <ActivityIndicator style={local.more} color={colors.textMuted} />
          ) : null
        }
        renderItem={({ item, index }) => {
          const fit = item.fit_score ?? undefined;
          const reviewer = reviewerName(item.assigned_to);
          const name = item.student_name || 'Student';
          return (
            <LedgerRow
              first={index === 0}
              title={shortlisting ? `${index + 1}. ${name}` : name}
              subtitle={item.program_name}
              onPress={() => open(item, index)}
              accessibilityLabel={`${name}, ${APPLICATION_STATUS_LABELS[item.status]}${fit !== undefined ? `, AI fit ${Math.round(fit)} percent` : ''}${reviewer ? `, reviewer ${reviewer}` : ''}`}>
              <View style={styles.metaLine}>
                {item.held_decision ? (
                  <StatusBadge
                    label={item.held_decision === 'accepted' ? 'Admit held' : 'Decline held'}
                    color={colors.status.underReview}
                  />
                ) : (
                  <StatusBadge
                    label={APPLICATION_STATUS_LABELS[item.status]}
                    color={applicationStatusColor(item.status, colors)}
                  />
                )}
                <Text style={[styles.meta, local.rowMeta]} numberOfLines={1}>
                  {[
                    item.documents_pending ? `${item.documents_pending} to review` : null,
                    item.ai_flags
                      ? `${item.ai_flags} AI flag${item.ai_flags === 1 ? '' : 's'}`
                      : null,
                    reviewer ? `Reviewer: ${reviewer}` : null,
                    item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
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
      <ActionSheet
        visible={sorting}
        onClose={() => setSorting(false)}
        eyebrow="Review queue"
        title="Sort applicants"
        actions={(Object.keys(SORTS) as QueueSort[]).map((key) => ({
          label: key === filters.sort ? `${SORTS[key].label} (current)` : SORTS[key].label,
          hint: SORTS[key].hint,
          onPress: () => set({ sort: key }),
        }))}
      />
      <ReleaseSheet
        visible={releasing}
        onClose={() => setReleasing(false)}
        held={held}
        releaseAt={releaseAt}
        nameOf={(id) =>
          studentName(held.find((h) => h.application_id === id)?.application?.student)
        }
      />
    </>
  );
}

/** A program's seats: sent and held admissions against its slots, with a shortlist. */
function SeatPanel({
  programName,
  slots,
  admitted,
  held,
  shortlisting,
  onShortlist,
}: {
  programName: string;
  slots: number;
  admitted: number;
  held: number;
  shortlisting: boolean;
  onShortlist?: () => void;
}) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const local = createStyles(colors);
  const taken = admitted + held;
  const left = slots - taken;
  const percent = slots > 0 ? Math.min(100, (taken / slots) * 100) : 100;

  return (
    <View
      style={local.seats}
      accessible
      accessibilityLabel={`${programName}: ${taken} of ${slots} seats taken`}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>
          {taken} of {slots} seats taken
        </Text>
        <Text style={[styles.meta, left < 0 && styles.dangerText]}>
          {left > 0 ? `${left} open` : left === 0 ? 'Full' : `${-left} over`}
        </Text>
      </View>
      <TickMeter value={percent} label="Seats taken" />
      <Text style={styles.meta}>
        {admitted} admitted{held ? ` · ${held} held for release` : ''}
      </Text>
      {onShortlist ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={onShortlist}>
          <Text style={local.clear}>
            {shortlisting ? 'Back to the full list' : `Shortlist the top ${left} by AI fit`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
