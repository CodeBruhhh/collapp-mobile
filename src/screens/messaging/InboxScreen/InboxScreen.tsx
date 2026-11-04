import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FilterTabs } from '@/components/FilterTabs';
import { LedgerRow } from '@/components/LedgerRow';
import { PageHeading } from '@/components/PageHeading';
import { Select } from '@/components/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { listCollegesForAdmin, type ThreadSummary } from '@/features/messaging/api';
import { useStartThread, useThreads } from '@/features/messaging/hooks';
import { threadRoute } from '@/features/notifications/routing';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { shortTime } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';
import type { Role } from '@/types/roles';

import { createStyles } from './InboxScreen.styles';

type RepFilter = 'students' | 'admin';

/** Who the conversation is with, from the viewer's side. */
function counterpart(role: Role, t: ThreadSummary): string {
  if (role === 'school_rep') {
    return t.kind === 'rep_admin' ? 'CollApp Administrator' : (t.student_name ?? 'Student');
  }
  return t.college_name;
}

/**
 * SDD screens 15 (student inbox), 26 (rep student inquiries + admin channel) and
 * the admin side of the rep channel. Threads only exist for SRS 3.6.5 pairs.
 */
export function InboxScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { role, session } = useAuth();
  const userId = session?.user.id;
  const threads = useThreads();
  const startThread = useStartThread();
  const [repFilter, setRepFilter] = useState<RepFilter>('students');

  const colleges = useQuery({
    queryKey: ['messaging', 'admin-colleges'],
    queryFn: listCollegesForAdmin,
    enabled: role === 'admin',
  });

  if (!role) return null;

  const all = threads.data ?? [];
  const visible =
    role === 'school_rep'
      ? all.filter((t) =>
          repFilter === 'admin' ? t.kind === 'rep_admin' : t.kind === 'student_rep',
        )
      : all;
  const unreadIn = (kind: ThreadSummary['kind']) =>
    all.filter((t) => t.kind === kind).reduce((n, t) => n + t.unread_count, 0);

  async function open(target: { collegeId?: string; studentId?: string }) {
    try {
      const thread = await startThread.mutateAsync(target);
      router.push(threadRoute(role!, thread.id));
    } catch (e) {
      notify.error('Could not open conversation', getErrorMessage(e));
    }
  }

  const header = (
    <View style={styles.header}>
      <PageHeading title="Conversations" />
      {role === 'school_rep' ? (
        <>
          <FilterTabs<RepFilter>
            value={repFilter}
            onChange={setRepFilter}
            options={[
              { value: 'students', label: 'Students', count: unreadIn('student_rep') || undefined },
              { value: 'admin', label: 'Administrator', count: unreadIn('rep_admin') || undefined },
            ]}
          />
          {repFilter === 'admin' ? (
            <Button
              variant="secondary"
              label="Message the CollApp administrator"
              loading={startThread.isPending}
              onPress={() => open({})}
            />
          ) : null}
        </>
      ) : role === 'admin' ? (
        <Select
          label="Message a college's representatives"
          value={null}
          placeholder={colleges.isPending ? 'Loading colleges…' : 'Choose a college'}
          options={(colleges.data ?? []).map((c) => c.name)}
          disabled={!colleges.data?.length || startThread.isPending}
          onChange={(name) => {
            const college = colleges.data?.find((c) => c.name === name);
            if (college) open({ collegeId: college.id });
          }}
        />
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(t) => t.id}
      refreshControl={
        <RefreshControl
          tintColor={colors.primary}
          colors={[colors.primary]}
          refreshing={threads.isRefetching}
          onRefresh={threads.refetch}
        />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        threads.isPending ? (
          <LoadingState />
        ) : threads.isError ? (
          <ErrorState error={threads.error} onRetry={threads.refetch} />
        ) : role === 'student' ? (
          <EmptyState
            icon="chatbubbles"
            title="No conversations yet"
            body="Open a university's page and tap Message admissions to ask a question."
            actionLabel="Explore universities"
            onAction={() => router.push('/student/explore')}
          />
        ) : role === 'school_rep' && repFilter === 'students' ? (
          <EmptyState
            icon="chatbubbles"
            title="No student inquiries"
            body="Students who message your college appear here. You can also message an applicant from their application."
          />
        ) : (
          <EmptyState icon="chatbubbles" title="No conversations yet" />
        )
      }
      renderItem={({ item, index }) => {
        const name = counterpart(role, item);
        const unread = item.unread_count > 0;
        const preview = item.last_message
          ? `${item.last_sender_id === userId ? 'You: ' : ''}${item.last_message}`
          : (item.subject ?? 'No messages yet');
        return (
          <LedgerRow
            first={index === 0}
            emphasis={unread}
            numberOfLines={1}
            title={name}
            subtitle={preview}
            onPress={() => router.push(threadRoute(role, item.id))}
            accessibilityLabel={`${name}${unread ? `, ${item.unread_count} unread` : ''}`}
            leading={
              role === 'school_rep' && item.kind === 'rep_admin' ? (
                <Avatar name={name} icon="shield-checkmark" size={44} />
              ) : (
                <Avatar
                  name={name}
                  logoPath={role === 'school_rep' ? null : item.college_logo_path}
                  size={44}
                />
              )
            }
            trailing={
              <View style={styles.side}>
                <Text style={styles.time}>{shortTime(item.last_message_at)}</Text>
                {unread ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread_count}</Text>
                  </View>
                ) : null}
              </View>
            }
          />
        );
      }}
    />
  );
}
