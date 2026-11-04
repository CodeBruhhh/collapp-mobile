import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
import { Icon } from '@/components/Icon';
import { InfoRow } from '@/components/InfoRow';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import type { AdminCollege, AdminUser } from '@/features/admin/api';
import {
  useAdminActions,
  useAllColleges,
  usePlatformSettings,
  useUsers,
} from '@/features/admin/hooks';
import { collegeLocation } from '@/features/colleges/api';
import { useTheme } from '@/hooks/useTheme';
import { ROLE_LABELS } from '@/types/roles';

import { createScreenStyles } from '@/screens/screenStyles';

type Section = 'users' | 'colleges';
type UserFilter = 'all' | 'student' | 'school_rep' | 'admin' | 'suspended';

const USER_FILTERS: Record<UserFilter, (u: AdminUser) => boolean> = {
  all: () => true,
  student: (u) => u.role === 'student',
  school_rep: (u) => u.role === 'school_rep',
  admin: (u) => u.role === 'admin',
  suspended: (u) => u.status === 'suspended',
};

const MAX_FEATURED = 10;

/** SDD screen 28 — user and institution management. */
export function AccountsScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const { session } = useAuth();
  const [section, setSection] = useState<Section>('users');
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');

  const users = useUsers(search);
  const colleges = useAllColleges();
  const settings = usePlatformSettings();
  const { userStatus, collegeStatus, savePlatformSettings } = useAdminActions();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<AdminCollege | null>(null);

  const featured = settings.data?.featured_college_ids ?? [];

  const isMe = (u: AdminUser) => u.id === session?.user.id;

  function userActions(u: AdminUser): SheetAction[] {
    if (isMe(u)) return [];
    const name = u.full_name || u.email;
    return u.status === 'active'
      ? [
          {
            label: 'Suspend account',
            hint: 'Signs them out and blocks access until reactivated',
            destructive: true,
            onPress: () => userStatus.mutateAsync([u.id, 'suspended']),
            confirm: {
              title: `Suspend ${name}?`,
              message:
                'They are signed out and lose access to all data immediately. You can reactivate them later.',
              label: 'Suspend account',
            },
          },
        ]
      : [
          {
            label: 'Reactivate account',
            hint: 'They can sign in and use CollApp again',
            onPress: () => userStatus.mutateAsync([u.id, 'active']),
          },
        ];
  }

  function collegeActions(c: AdminCollege): SheetAction[] {
    const isFeatured = featured.includes(c.id);
    const published = c.profile_status === 'published';
    const featureFull = !isFeatured && featured.length >= MAX_FEATURED;
    return [
      published
        ? {
            label: 'Unpublish',
            hint: 'Back to draft: students can no longer find it',
            destructive: true,
            onPress: () => collegeStatus.mutateAsync([c.id, 'draft']),
            confirm: {
              title: `Unpublish ${c.name}?`,
              message:
                'It disappears from search and the student home right away. Existing applications are kept.',
              label: 'Unpublish college',
            },
          }
        : {
            label: 'Publish',
            hint: 'Make it visible to students',
            onPress: () => collegeStatus.mutateAsync([c.id, 'published']),
          },
      ...(published || isFeatured
        ? [
            {
              label: isFeatured ? 'Remove from featured' : 'Feature on student home',
              hint: featureFull
                ? `The featured list is full (${MAX_FEATURED}). Remove one first.`
                : `${featured.length} of ${MAX_FEATURED} featured`,
              disabled: featureFull,
              onPress: () =>
                savePlatformSettings.mutateAsync({
                  featured_college_ids: isFeatured
                    ? featured.filter((id) => id !== c.id)
                    : [...featured, c.id],
                }),
            },
          ]
        : []),
    ];
  }

  const sheets = (
    <>
      {selectedUser ? (
        <ActionSheet
          visible
          onClose={() => setSelectedUser(null)}
          eyebrow={ROLE_LABELS[selectedUser.role]}
          title={selectedUser.full_name || 'No name'}
          subtitle={selectedUser.email}
          message={
            isMe(selectedUser)
              ? 'This is your account. Administrators cannot suspend themselves.'
              : undefined
          }
          actions={userActions(selectedUser)}
          cancelLabel="Close">
          <InfoRow
            label="Status"
            value={selectedUser.status === 'active' ? 'Active' : 'Suspended'}
          />
          {selectedUser.college ? (
            <InfoRow label="College" value={selectedUser.college.name} />
          ) : null}
        </ActionSheet>
      ) : null}
      {selectedCollege ? (
        <ActionSheet
          visible
          onClose={() => setSelectedCollege(null)}
          eyebrow="College"
          title={selectedCollege.name}
          subtitle={collegeLocation(selectedCollege) || undefined}
          actions={collegeActions(selectedCollege)}
          cancelLabel="Close">
          <InfoRow
            label="Visibility"
            value={
              selectedCollege.profile_status === 'published'
                ? 'Published'
                : 'Draft · hidden from students'
            }
          />
          <InfoRow
            label="Student home"
            value={featured.includes(selectedCollege.id) ? 'Featured' : 'Not featured'}
          />
        </ActionSheet>
      ) : null}
    </>
  );

  const userList = (users.data ?? []).filter(USER_FILTERS[userFilter]);
  const tally =
    section === 'users'
      ? users.data && `${userList.length} ${userList.length === 1 ? 'person' : 'people'}`
      : colleges.data &&
        `${colleges.data.length} ${colleges.data.length === 1 ? 'college' : 'colleges'} · ${featured.length} featured`;

  const header = (
    <View style={[styles.section, styles.listHeader]}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Directory
        </Text>
        <Text style={styles.subtitle}>Who can sign in, and which colleges students can see.</Text>
      </View>
      <FilterTabs<Section>
        value={section}
        onChange={setSection}
        options={[
          { value: 'users', label: 'Users' },
          { value: 'colleges', label: 'Colleges' },
        ]}
      />
      {section === 'users' ? (
        <>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={draftSearch}
              onChangeText={setDraftSearch}
              onSubmitEditing={() => setSearch(draftSearch)}
              placeholder="Search name or email"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Search users"
              returnKeyType="search"
              autoCapitalize="none"
              style={styles.searchInput}
            />
          </View>
          <FilterTabs<UserFilter>
            value={userFilter}
            onChange={setUserFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'student', label: 'Students' },
              { value: 'school_rep', label: 'Reps' },
              { value: 'admin', label: 'Admins' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </>
      ) : (
        <Button
          label="Add college and representative"
          onPress={() => router.push('/admin/college/new')}
        />
      )}
      {tally ? <Text style={styles.tally}>{tally}</Text> : null}
    </View>
  );

  if (section === 'users') {
    return (
      <>
        <FlatList
          style={styles.root}
          contentContainerStyle={styles.listContent}
          data={userList}
          keyExtractor={(u) => u.id}
          ListHeaderComponent={header}
          refreshControl={
            <RefreshControl refreshing={users.isRefetching} onRefresh={users.refetch} />
          }
          ListEmptyComponent={
            users.isPending ? (
              <LoadingState />
            ) : users.isError ? (
              <ErrorState error={users.error} onRetry={users.refetch} />
            ) : (
              <EmptyState icon="people" title="No users match" />
            )
          }
          renderItem={({ item, index }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedUser(item)}
              accessibilityLabel={`${item.full_name || item.email}, ${ROLE_LABELS[item.role]}, ${item.status}`}
              style={({ pressed }) => [
                styles.ledgerRow,
                index === 0 && styles.ledgerTop,
                pressed && styles.pressed,
              ]}>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.full_name || 'No name'}
                    {item.id === session?.user.id ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.email}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {ROLE_LABELS[item.role]}
                    {item.college ? ` · ${item.college.name}` : ''}
                  </Text>
                </View>
                <StatusBadge
                  label={item.status === 'active' ? 'Active' : 'Suspended'}
                  color={item.status === 'active' ? colors.status.accepted : colors.danger}
                />
              </View>
            </Pressable>
          )}
        />
        {sheets}
      </>
    );
  }

  return (
    <>
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.listContent}
        data={colleges.data ?? []}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={colleges.isRefetching} onRefresh={colleges.refetch} />
        }
        ListEmptyComponent={
          colleges.isPending ? (
            <LoadingState />
          ) : colleges.isError ? (
            <ErrorState error={colleges.error} onRetry={colleges.refetch} />
          ) : (
            <EmptyState icon="school" title="No colleges yet" />
          )
        }
        renderItem={({ item, index }) => {
          const isFeatured = featured.includes(item.id);
          const published = item.profile_status === 'published';
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedCollege(item)}
              accessibilityLabel={`${item.name}, ${published ? 'published' : 'draft'}${isFeatured ? ', featured' : ''}`}
              style={({ pressed }) => [
                styles.ledgerRow,
                index === 0 && styles.ledgerTop,
                pressed && styles.pressed,
              ]}>
              <View style={styles.row}>
                <CollegeLogo name={item.name} logoPath={item.logo_path} size={40} />
                <View style={styles.flex}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {collegeLocation(item)}
                  </Text>
                </View>
                <View style={styles.badges}>
                  <StatusBadge
                    label={published ? 'Published' : 'Draft'}
                    color={published ? colors.status.accepted : colors.status.draft}
                  />
                  {isFeatured ? <StatusBadge label="Featured" color={colors.primary} /> : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      {sheets}
    </>
  );
}
