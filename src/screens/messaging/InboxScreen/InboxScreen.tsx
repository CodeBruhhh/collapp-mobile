import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { Select } from '@/components/Select';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { useAuth } from '@/context/AuthContext';
import { listCollegesForAdmin, type ThreadSummary } from '@/features/messaging/api';
import { useStartThread, useThreads } from '@/features/messaging/hooks';
import { threadRoute } from '@/features/notifications/routing';
import { useTheme } from '@/hooks/useTheme';
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
      Alert.alert('Could not open conversation', getErrorMessage(e));
    }
  }

  const header =
    role === 'school_rep' ? (
      <View style={styles.header}>
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
      </View>
    ) : role === 'admin' ? (
      <View style={styles.header}>
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
      </View>
    ) : null;

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={(t) => t.id}
      refreshControl={
        <RefreshControl refreshing={threads.isRefetching} onRefresh={threads.refetch} />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        threads.isPending ? (
          <LoadingState />
        ) : threads.isError ? (
          <ErrorState error={threads.error} onRetry={threads.refetch} />
        ) : role === 'student' ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No conversations yet"
            body="Open a university's page and tap Message admissions to ask a question."
            actionLabel="Explore universities"
            onAction={() => router.push('/student/explore')}
          />
        ) : role === 'school_rep' && repFilter === 'students' ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No student inquiries"
            body="Students who message your college appear here. You can also message an applicant from their application."
          />
        ) : (
          <EmptyState icon="chatbubbles-outline" title="No conversations yet" />
        )
      }
      renderItem={({ item }) => {
        const name = counterpart(role, item);
        const unread = item.unread_count > 0;
        const preview = item.last_message
          ? `${item.last_sender_id === userId ? 'You: ' : ''}${item.last_message}`
          : (item.subject ?? 'No messages yet');
        return (
          <Card
            onPress={() => router.push(threadRoute(role, item.id))}
            accessibilityLabel={`${name}${unread ? `, ${item.unread_count} unread` : ''}`}>
            <View style={styles.row}>
              {role === 'school_rep' && item.kind === 'rep_admin' ? (
                <View style={styles.adminAvatar}>
                  <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
                </View>
              ) : (
                <CollegeLogo
                  name={name}
                  logoPath={role === 'school_rep' ? null : item.college_logo_path}
                />
              )}
              <View style={styles.info}>
                <View style={styles.topLine}>
                  <Text style={[styles.title, unread && styles.unreadTitle]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.time}>{shortTime(item.last_message_at)}</Text>
                </View>
                <View style={styles.topLine}>
                  <Text style={[styles.preview, unread && styles.unreadPreview]} numberOfLines={1}>
                    {preview}
                  </Text>
                  {unread ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread_count}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </Card>
        );
      }}
    />
  );
}
