import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { useAuth } from '@/context/AuthContext';
import { useMyApplications } from '@/features/applications/hooks';
import { collegeLocation } from '@/features/colleges/api';
import { useColleges } from '@/features/colleges/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './HomeScreen.styles';

/**
 * SDD screen 6 — greeting, application summary (web dashboard stat cards) and
 * colleges to explore. AI recommendations and the institutional feed join in Phase 4.
 */
export function HomeScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { profile } = useAuth();
  const applications = useMyApplications();
  const colleges = useColleges({});

  const apps = applications.data ?? [];
  const stats = [
    { label: 'Applications', value: apps.filter((a) => a.status !== 'draft').length },
    {
      label: 'In review',
      value: apps.filter((a) => ['submitted', 'under_review', 'action_required'].includes(a.status))
        .length,
    },
    { label: 'Accepted', value: apps.filter((a) => a.status === 'accepted').length },
  ];
  const drafts = apps.filter((a) => a.status === 'draft');
  const actionRequired = apps.filter((a) => a.status === 'action_required');
  const firstName = profile?.full_name.split(' ')[0] ?? 'there';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={applications.isRefetching || colleges.isRefetching}
          onRefresh={() => {
            applications.refetch();
            colleges.refetch();
          }}
        />
      }>
      <View>
        <Text accessibilityRole="header" style={styles.greeting}>
          Hello, {firstName}
        </Text>
        <Text style={styles.meta}>Explore. Plan. Build your future.</Text>
      </View>

      <Pressable
        accessibilityRole="search"
        accessibilityLabel="Search universities"
        onPress={() => router.push('/student/explore')}
        style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <Text style={styles.searchText}>Search universities, programs or locations</Text>
      </Pressable>

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat} accessibilityLabel={`${s.label}: ${s.value}`}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {actionRequired.map((a) => (
        <Card
          key={a.id}
          style={{ borderColor: colors.status.actionRequired }}
          onPress={() =>
            router.push({ pathname: '/student/application/[id]', params: { id: a.id } })
          }>
          <Text style={styles.cardTitle}>Action required · {a.college?.name}</Text>
          <Text style={styles.meta}>A document needs to be resubmitted.</Text>
        </Card>
      ))}

      {drafts.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finish your drafts</Text>
          {drafts.map((a) => (
            <Card
              key={a.id}
              onPress={() =>
                router.push({
                  pathname: '/student/apply/[collegeId]',
                  params: { collegeId: a.college_id },
                })
              }>
              <Text style={styles.cardTitle}>{a.college?.name}</Text>
              <Text style={styles.meta}>{a.program?.name}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Universities to explore</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/student/explore')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {(colleges.data ?? []).slice(0, 5).map((c) => (
          <Card
            key={c.id}
            onPress={() =>
              router.push({ pathname: '/student/college/[id]', params: { id: c.id } })
            }>
            <View style={styles.row}>
              <CollegeLogo name={c.name} logoPath={c.logo_path} size={40} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <Text style={styles.meta}>{collegeLocation(c)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
