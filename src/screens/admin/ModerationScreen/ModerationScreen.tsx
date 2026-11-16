import { Stack } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { FilterTabs } from '@/components/FilterTabs';
import { Icon } from '@/components/Icon';
import { InfoRow } from '@/components/InfoRow';
import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { StatusBadge } from '@/components/StatusBadge';
import type { ModerationAction, ModerationItem } from '@/features/admin/api';
import { useAdminActions, useModerationQueue } from '@/features/admin/hooks';
import { REASON_LABELS } from '@/features/feed/reports';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { shortTime } from '@/lib/time';

import { createScreenStyles } from '@/screens/screenStyles';

type Section = 'open' | 'resolved';

const RESOLUTION_LABELS: Record<NonNullable<ModerationItem['resolution']>, string> = {
  dismissed: 'Dismissed',
  comment_removed: 'Comment removed',
  post_taken_down: 'Post taken down',
  author_suspended: 'Author suspended',
};

const itemKey = (i: ModerationItem) => `${i.target}:${i.post_id}:${i.comment_id ?? ''}`;

/** Reported campus posts and comments: review, remove, take down or dismiss. */
export function ModerationScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const [section, setSection] = useState<Section>('open');
  const open = useModerationQueue('open');
  const resolved = useModerationQueue('resolved');
  const queue = section === 'open' ? open : resolved;
  const [selected, setSelected] = useState<ModerationItem | null>(null);

  const header = (
    <View style={[styles.section, styles.listHeader]}>
      <PageHeading
        title="Moderation"
        subtitle="Posts and comments students reported on the campus feed."
      />
      <FilterTabs<Section>
        value={section}
        onChange={setSection}
        options={[
          { value: 'open', label: 'Needs review', count: open.data?.length },
          { value: 'resolved', label: 'Resolved (30 days)' },
        ]}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Moderation' }} />
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.listContent}
        data={queue.data ?? []}
        keyExtractor={itemKey}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl
            tintColor={colors.primary}
            colors={[colors.primary]}
            refreshing={queue.isRefetching}
            onRefresh={queue.refetch}
          />
        }
        ListEmptyComponent={
          queue.isPending ? (
            <LoadingState />
          ) : queue.isError ? (
            <ErrorState error={queue.error} onRetry={queue.refetch} />
          ) : (
            <EmptyState
              icon="shield-checkmark"
              title={section === 'open' ? 'Nothing to review' : 'Nothing resolved recently'}
              body={
                section === 'open'
                  ? 'When students report a post or comment, it shows up here.'
                  : undefined
              }
            />
          )
        }
        renderItem={({ item, index }) => (
          <LedgerRow
            first={index === 0}
            title={item.target === 'comment' ? `“${item.snapshot}”` : item.post_title}
            subtitle={
              item.target === 'comment'
                ? `Comment on “${item.post_title}” · ${item.college_name}`
                : `Post by ${item.college_name}`
            }
            numberOfLines={3}
            leading={
              <Icon
                name={item.target === 'comment' ? 'chatbubble-ellipses' : 'megaphone'}
                size={20}
                color={section === 'open' ? colors.danger : colors.textMuted}
              />
            }
            onPress={() => setSelected(item)}
            accessibilityLabel={`${item.target === 'comment' ? 'Reported comment' : 'Reported post'}, ${item.report_count} reports`}
            trailing={
              section === 'open' ? (
                <StatusBadge
                  label={`${item.report_count} ${item.report_count === 1 ? 'report' : 'reports'}`}
                  color={colors.danger}
                />
              ) : item.resolution ? (
                <StatusBadge
                  label={RESOLUTION_LABELS[item.resolution]}
                  color={colors.status.draft}
                />
              ) : undefined
            }>
            <Text style={styles.meta} numberOfLines={1}>
              {item.reasons.map((r) => REASON_LABELS[r] ?? r).join(' · ')}
              {' · '}
              {shortTime(
                section === 'open'
                  ? item.last_reported_at
                  : (item.resolved_at ?? item.last_reported_at),
              )}
            </Text>
          </LedgerRow>
        )}
      />
      {selected ? (
        <ModerationSheet
          item={selected}
          open={section === 'open'}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}

function ModerationSheet({
  item,
  open,
  onClose,
}: {
  item: ModerationItem;
  open: boolean;
  onClose: () => void;
}) {
  const { moderateContent } = useAdminActions();
  const isComment = item.target === 'comment';
  const author = item.author_name || item.author_email || 'Unknown student';

  const run = (action: ModerationAction, done: string) => async () => {
    await moderateContent.mutateAsync({
      postId: item.post_id,
      commentId: item.comment_id,
      action,
      note:
        action === 'take_down_post'
          ? `Reported as ${item.reasons.map((r) => REASON_LABELS[r]?.toLowerCase() ?? r).join(', ')}`
          : undefined,
    });
    notify.success(done);
  };

  const actions: SheetAction[] = [];
  if (open && isComment) {
    actions.push(
      {
        label: 'Remove comment',
        hint: 'Deletes it for everyone',
        destructive: true,
        disabled: !item.comment_exists,
        onPress: run('remove_comment', 'Comment removed'),
      },
      {
        label: 'Remove comment and suspend author',
        hint: `${author} is signed out and blocked until reactivated`,
        destructive: true,
        disabled: !item.author_id || item.author_status === 'suspended',
        onPress: run('suspend_author', 'Comment removed and author suspended'),
        confirm: {
          title: `Suspend ${author}?`,
          message:
            'Their comment is deleted and they lose access to CollApp, including their applications, until an administrator reactivates them in Accounts.',
          label: 'Remove and suspend',
        },
      },
    );
  }
  if (open && !isComment) {
    actions.push({
      label: 'Take down post',
      hint: "Hides it from students; the college's representatives are told why",
      destructive: true,
      onPress: run('take_down_post', 'Post taken down'),
      confirm: {
        title: 'Take this post down?',
        message:
          'Students stop seeing it and its comments right away. The college cannot republish it unless you restore it.',
        label: 'Take down post',
      },
    });
  }
  if (open) {
    actions.push({
      label: 'Dismiss reports',
      hint: 'Nothing wrong: close the reports and keep it up',
      onPress: run('dismiss', 'Reports dismissed'),
    });
  }
  if (!isComment && item.taken_down_at) {
    actions.push({
      label: 'Restore post',
      hint: 'Publish it to student feeds again',
      onPress: run('restore_post', 'Post restored'),
    });
  }

  return (
    <ActionSheet
      visible
      onClose={onClose}
      eyebrow={isComment ? 'Reported comment' : 'Reported post'}
      title={isComment ? `“${item.snapshot}”` : item.post_title}
      subtitle={isComment ? `On “${item.post_title}” by ${item.college_name}` : item.college_name}
      actions={actions}
      cancelLabel="Close">
      <InfoRow
        label="Reports"
        value={`${item.report_count} · ${item.reasons.map((r) => REASON_LABELS[r] ?? r).join(', ')}`}
      />
      {item.details?.length ? <InfoRow label="Notes" value={item.details.join(' / ')} /> : null}
      {isComment ? (
        <InfoRow
          label="Author"
          value={`${author}${item.author_status === 'suspended' ? ' (suspended)' : ''}`}
        />
      ) : null}
      {isComment && !item.comment_exists ? (
        <InfoRow label="Comment" value="Already removed" />
      ) : null}
      {!isComment ? (
        <InfoRow
          label="Post"
          value={
            item.taken_down_at ? 'Taken down' : item.post_status === 'published' ? 'Live' : 'Draft'
          }
        />
      ) : null}
      <InfoRow label="First reported" value={shortTime(item.first_reported_at)} />
      {item.resolution ? (
        <InfoRow
          label="Outcome"
          value={`${RESOLUTION_LABELS[item.resolution]}${item.resolved_by_name ? ` by ${item.resolved_by_name}` : ''}`}
        />
      ) : null}
    </ActionSheet>
  );
}
