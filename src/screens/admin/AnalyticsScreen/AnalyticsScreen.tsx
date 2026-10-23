import { router } from 'expo-router';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StatusBadge } from '@/components/StatusBadge';
import { ToggleRow } from '@/components/ToggleRow';
import { useAdminActions, useAdminStats, usePlatformSettings } from '@/features/admin/hooks';
import { APPLICATION_STATUS_LABELS, applicationStatusColor } from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';
import { Constants } from '@/types/database';

import { CHART_MAX_BAR, createAdminStyles } from '../adminStyles';

/** SDD screen 27 — platform totals, weekly submissions and the platform switches. */
export function AnalyticsScreen() {
  const { colors } = useTheme();
  const styles = createAdminStyles(colors);
  const stats = useAdminStats();
  const settings = usePlatformSettings();
  const { savePlatformSettings } = useAdminActions();

  if (stats.isPending) return <LoadingState />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={stats.refetch} />;

  const s = stats.data;
  const totals = [
    { label: 'Students', value: s.users.student },
    { label: 'Reps', value: s.users.school_rep },
    { label: 'Colleges live', value: s.colleges.published },
    { label: 'Suspended', value: s.users.suspended },
  ];
  const weeks = s.weekly_submissions;
  const peak = Math.max(1, ...weeks.map((w) => w.count));
  const submittedTotal = weeks.reduce((n, w) => n + w.count, 0);

  function save(changes: Parameters<typeof savePlatformSettings.mutate>[0]) {
    savePlatformSettings.mutate(changes, {
      onError: (e) => Alert.alert('Could not update the platform', getErrorMessage(e)),
    });
  }

  function confirmMaintenance(on: boolean) {
    if (!on) return save({ maintenance_mode: false });
    Alert.alert(
      'Turn on maintenance mode?',
      'Students and representatives will see a maintenance screen until you turn it off. Administrators keep access.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Turn on', style: 'destructive', onPress: () => save({ maintenance_mode: true }) },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={stats.isRefetching}
          onRefresh={() => {
            stats.refetch();
            settings.refetch();
          }}
        />
      }>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          Platform overview
        </Text>
        <Text style={styles.subtitle}>Live totals across every college.</Text>
      </View>

      <View style={styles.stats}>
        {totals.map((t) => (
          <View key={t.label} style={styles.stat} accessibilityLabel={`${t.label}: ${t.value}`}>
            <Text style={styles.statValue}>{t.value}</Text>
            <Text style={styles.statLabel}>{t.label}</Text>
          </View>
        ))}
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Applications submitted</Text>
          <Text style={styles.meta}>{submittedTotal} in 8 weeks</Text>
        </View>
        <View
          style={styles.chart}
          accessible
          accessibilityLabel={`Weekly submissions: ${weeks.map((w) => w.count).join(', ')}`}>
          {weeks.map((w) => (
            <View key={w.week} style={styles.barColumn}>
              <Text style={styles.barValue}>{w.count || ''}</Text>
              <View style={[styles.bar, { height: (w.count / peak) * CHART_MAX_BAR }]} />
              <Text style={styles.barLabel}>
                {new Date(w.week).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Applications by status</Text>
        {Constants.public.Enums.application_status.map((status) => (
          <View key={status} style={styles.rowBetween}>
            <StatusBadge
              label={APPLICATION_STATUS_LABELS[status]}
              color={applicationStatusColor(status, colors)}
            />
            <Text style={styles.cardTitle}>{s.applications[status] ?? 0}</Text>
          </View>
        ))}
      </Card>

      <Card onPress={() => router.push('/admin/compliance')}>
        <View style={styles.rowBetween}>
          <Text style={styles.meta}>Messages in the last 7 days</Text>
          <Text style={styles.cardTitle}>{s.messages_last_7_days}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.meta}>Blocked attachments</Text>
          <Text style={[styles.cardTitle, s.blocked_attachments > 0 && styles.dangerText]}>
            {s.blocked_attachments}
          </Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.meta}>Draft colleges (not visible to students)</Text>
          <Text style={styles.cardTitle}>{s.colleges.draft}</Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Platform controls</Text>
        <Card>
          {settings.isPending ? (
            <LoadingState />
          ) : settings.isError ? (
            <ErrorState error={settings.error} onRetry={settings.refetch} />
          ) : (
            <>
              <ToggleRow
                label="Accept applications"
                description="When off, students can keep drafts but cannot submit."
                value={settings.data.applications_open}
                onChange={(open) => save({ applications_open: open })}
              />
              <ToggleRow
                label="Maintenance mode"
                description="Temporarily close the app for everyone except administrators."
                value={settings.data.maintenance_mode}
                onChange={confirmMaintenance}
              />
              <Text style={styles.meta}>
                Featured colleges are chosen in Accounts › Colleges. Every change is audit-logged.
              </Text>
            </>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}
