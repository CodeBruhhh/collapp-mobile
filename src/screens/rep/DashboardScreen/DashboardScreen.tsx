import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/StateView';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { APPLICANT_FILTERS, studentName } from '@/features/rep/api';
import { useApplicants, useMyCollege } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createRepStyles } from '../repStyles';

/** SDD screen 19 — applicant counts, profile status, recent applicants and quick actions. */
export function DashboardScreen() {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const college = useMyCollege();
  const applicants = useApplicants();

  if (college.isPending) return <LoadingState />;
  if (college.isError) return <ErrorState error={college.error} onRetry={college.refetch} />;

  const c = college.data;
  const list = applicants.data ?? [];
  const stats = [
    { label: 'Applicants', value: list.length },
    { label: 'New', value: list.filter(APPLICANT_FILTERS.new).length },
    { label: 'In review', value: list.filter(APPLICANT_FILTERS.review).length },
    { label: 'Accepted', value: list.filter(APPLICANT_FILTERS.accepted).length },
  ];
  const isDraft = c.profile_status === 'draft';

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={college.isRefetching || applicants.isRefetching}
          onRefresh={() => {
            college.refetch();
            applicants.refetch();
          }}
        />
      }>
      <View style={styles.row}>
        <CollegeLogo name={c.name} logoPath={c.logo_path} size={56} />
        <View style={styles.flex}>
          <Text accessibilityRole="header" style={styles.title}>
            Welcome back
          </Text>
          <Text style={styles.subtitle}>{c.name}</Text>
        </View>
      </View>

      {isDraft ? (
        <View style={styles.banner}>
          <Text style={styles.cardTitle}>Your profile is not published</Text>
          <Text style={styles.meta}>
            Students can&apos;t find or apply to {c.name} until you publish it. Add your programs
            and requirements first.
          </Text>
          <Button label="Finish profile" onPress={() => router.push('/rep/institution')} />
        </View>
      ) : null}

      <View style={styles.stats}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat} accessibilityLabel={`${s.label}: ${s.value}`}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button label="Review applicants" onPress={() => router.push('/rep/applicants')} />
        </View>
        <View style={styles.action}>
          <Button
            variant="secondary"
            label="Requirements"
            onPress={() => router.push('/rep/requirements')}
          />
        </View>
        <View style={styles.action}>
          <Button
            variant="secondary"
            label="Create post"
            onPress={() => router.push({ pathname: '/rep/post/[id]', params: { id: 'new' } })}
          />
        </View>
        <View style={styles.action}>
          <Button
            variant="secondary"
            label="Messages"
            onPress={() => router.push('/rep/messages')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent applicants</Text>
        {list.length === 0 ? (
          <Text style={styles.meta}>No applications yet.</Text>
        ) : (
          list.slice(0, 5).map((a) => (
            <Card
              key={a.id}
              onPress={() =>
                router.push({ pathname: '/rep/applicant/[id]', params: { id: a.id } })
              }>
              <View style={styles.rowBetween}>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{studentName(a.student)}</Text>
                  <Text style={styles.meta}>{a.program?.name}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
              <StatusBadge
                label={APPLICATION_STATUS_LABELS[a.status]}
                color={applicationStatusColor(a.status, colors)}
              />
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}
