import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { FilterTabs } from '@/components/FilterTabs';
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
import { getErrorMessage } from '@/lib/validation';
import { ROLE_LABELS } from '@/types/roles';

import { createAdminStyles } from '../adminStyles';

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
  const styles = createAdminStyles(colors);
  const { session } = useAuth();
  const [section, setSection] = useState<Section>('users');
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');

  const users = useUsers(search);
  const colleges = useAllColleges();
  const settings = usePlatformSettings();
  const { userStatus, collegeStatus, savePlatformSettings } = useAdminActions();

  const featured = settings.data?.featured_college_ids ?? [];

  function run<T>(promise: Promise<T>, failure: string) {
    promise.catch((e) => Alert.alert(failure, getErrorMessage(e)));
  }

  function manageUser(u: AdminUser) {
    if (u.id === session?.user.id) {
      Alert.alert('This is your account', 'Administrators cannot suspend themselves.');
      return;
    }
    const suspending = u.status === 'active';
    Alert.alert(
      suspending ? `Suspend ${u.full_name || u.email}?` : `Reactivate ${u.full_name || u.email}?`,
      suspending
        ? 'They are signed out and lose access to all data immediately. You can reactivate them later.'
        : 'They can sign in and use CollApp again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: suspending ? 'Suspend' : 'Reactivate',
          style: suspending ? 'destructive' : 'default',
          onPress: () =>
            run(
              userStatus.mutateAsync([u.id, suspending ? 'suspended' : 'active']),
              'Could not update the account',
            ),
        },
      ],
    );
  }

  function manageCollege(c: AdminCollege) {
    const isFeatured = featured.includes(c.id);
    const published = c.profile_status === 'published';
    Alert.alert(c.name, published ? 'Visible to students.' : 'Draft: hidden from students.', [
      {
        text: published ? 'Unpublish' : 'Publish',
        style: published ? 'destructive' : 'default',
        onPress: () =>
          run(
            collegeStatus.mutateAsync([c.id, published ? 'draft' : 'published']),
            'Could not update the college',
          ),
      },
      ...(published || isFeatured
        ? [
            {
              text: isFeatured ? 'Remove from featured' : 'Feature on student home',
              onPress: () => {
                if (!isFeatured && featured.length >= MAX_FEATURED) {
                  Alert.alert('Too many featured', `Feature up to ${MAX_FEATURED} colleges.`);
                  return;
                }
                run(
                  savePlatformSettings.mutateAsync({
                    featured_college_ids: isFeatured
                      ? featured.filter((id) => id !== c.id)
                      : [...featured, c.id],
                  }),
                  'Could not update featured colleges',
                );
              },
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  const header = (
    <View style={styles.section}>
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
            <Ionicons name="search" size={18} color={colors.textMuted} />
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
    </View>
  );

  if (section === 'users') {
    const list = (users.data ?? []).filter(USER_FILTERS[userFilter]);
    return (
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={list}
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
            <EmptyState icon="people-outline" title="No users match" />
          )
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => manageUser(item)}
            accessibilityLabel={`${item.full_name || item.email}, ${ROLE_LABELS[item.role]}, ${item.status}`}>
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
          </Card>
        )}
      />
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
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
          <EmptyState icon="school-outline" title="No colleges yet" />
        )
      }
      renderItem={({ item }) => {
        const isFeatured = featured.includes(item.id);
        const published = item.profile_status === 'published';
        return (
          <Card
            onPress={() => manageCollege(item)}
            accessibilityLabel={`${item.name}, ${published ? 'published' : 'draft'}${isFeatured ? ', featured' : ''}`}>
            <View style={styles.row}>
              <CollegeLogo name={item.name} logoPath={item.logo_path} size={44} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {collegeLocation(item)}
                </Text>
              </View>
              {isFeatured ? (
                <Ionicons name="star" size={18} color={colors.status.underReview} />
              ) : null}
            </View>
            <StatusBadge
              label={published ? 'Published' : 'Draft'}
              color={published ? colors.status.accepted : colors.status.draft}
            />
          </Card>
        );
      }}
    />
  );
}
