import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Switch, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { BarChart } from '@/components/BarChart';
import { Icon, type IconName } from '@/components/Icon';
import { MetricPanel } from '@/components/MetricPanel';
import { MetricRows } from '@/components/MetricRow';
import { PageHeading } from '@/components/PageHeading';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useAdminActions, useAdminStats, usePlatformSettings } from '@/features/admin/hooks';
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import { createAnalyticsStyles } from './AnalyticsScreen.styles';

const STATUS_ROWS: { status: ApplicationStatus; icon: IconName }[] = [
  { status: 'draft', icon: 'status-draft' },
  { status: 'submitted', icon: 'status-submitted' },
  { status: 'under_review', icon: 'status-under-review' },
  { status: 'accepted', icon: 'status-accepted' },
  { status: 'action_required', icon: 'status-action-required' },
  { status: 'rejected', icon: 'status-rejected' },
];

/** `2026-10-19…` -> `19/10`, without a timezone round-trip. */
function weekLabel(week: string) {
  const [, month, day] = week.slice(0, 10).split('-');
  return `${day}/${month}`;
}

/** SDD screen 27 — platform totals, weekly submissions and the platform switches. */
export function AnalyticsScreen() {
  const { colors: c } = useTheme();
  const styles = createAnalyticsStyles(c);
  const stats = useAdminStats();
  const settings = usePlatformSettings();
  const { savePlatformSettings } = useAdminActions();
  const scrollRef = useRef<ScrollView>(null);
  const controlsY = useRef(0);
  const [maintenanceSheet, setMaintenanceSheet] = useState(false);

  if (stats.isPending) return <LoadingState variant="detail" />;
  if (stats.isError) return <ErrorState error={stats.error} onRetry={stats.refetch} />;

  const s = stats.data;
  const accountTotals = [
    { label: 'Students', value: s.users.student },
    { label: 'Reps', value: s.users.school_rep },
    { label: 'Suspended', value: s.users.suspended },
  ];
  const weeks = s.weekly_submissions;
  const submittedTotal = weeks.reduce((n, w) => n + w.count, 0);

  function save(changes: Parameters<typeof savePlatformSettings.mutate>[0]) {
    savePlatformSettings.mutate(changes, {
      onError: (e) => notify.error('Could not update the platform', getErrorMessage(e)),
    });
  }

  function confirmMaintenance(on: boolean) {
    if (!on) return save({ maintenance_mode: false });
    setMaintenanceSheet(true);
  }

  const operations = [
    { label: 'Messages in the last 7 days', value: s.messages_last_7_days },
    {
      label: 'Blocked attachments',
      value: s.blocked_attachments,
      accent: s.blocked_attachments > 0,
    },
    { label: 'Draft colleges', hint: 'Not visible to students', value: s.colleges.draft },
  ];

  const controls = settings.data && [
    {
      label: 'Accept applications',
      hint: 'When enabled, students can submit applications.',
      value: settings.data.applications_open,
      onChange: (open: boolean) => save({ applications_open: open }),
    },
    {
      label: 'Maintenance mode',
      hint: 'Enable maintenance mode while platform updates are in progress.',
      value: settings.data.maintenance_mode,
      onChange: confirmMaintenance,
    },
  ];

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={c.primary}
          colors={[c.primary]}
          refreshing={stats.isRefetching}
          onRefresh={() => {
            stats.refetch();
            settings.refetch();
          }}
        />
      }>
      <View style={styles.overview}>
        <PageHeading
          title="Platform overview"
          subtitle="Live totals across every college."
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to platform controls"
              hitSlop={4}
              onPress={() => scrollRef.current?.scrollTo({ y: controlsY.current, animated: true })}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Icon name="options" size={18} color={c.text} />
            </Pressable>
          }
        />
        <View style={styles.totals}>
          <MetricPanel label="Colleges live" value={s.colleges.published} icon="college" />
          <MetricRows metrics={accountTotals} />
        </View>
      </View>

      <View style={[styles.section, styles.sheet]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Applications submitted
        </Text>
        <View style={styles.total}>
          <Text style={styles.totalValue}>{submittedTotal}</Text>
          <Text style={styles.totalMeta}>in {weeks.length} weeks</Text>
        </View>
        <BarChart
          title="Weekly submissions"
          bars={weeks.map((w) => ({ key: w.week, label: weekLabel(w.week), value: w.count }))}
        />
      </View>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Applications by status
        </Text>
        <View>
          {STATUS_ROWS.map(({ status, icon }) => {
            const count = s.applications[status] ?? 0;
            const accepted = status === 'accepted';
            return (
              <View
                key={status}
                style={[styles.statusRow, styles.ruled]}
                accessible
                accessibilityLabel={`${APPLICATION_STATUS_LABELS[status]}: ${count}`}>
                <Icon name={icon} size={16} color={accepted ? c.primary : c.text} />
                <Text style={[styles.statusLabel, accepted && styles.statusLabelAccent]}>
                  {APPLICATION_STATUS_LABELS[status]}
                </Text>
                <Text style={[styles.statusCount, count > 0 && styles.countActive]}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, styles.flush]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Operations
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityHint="Opens compliance"
          onPress={() => router.push('/admin/compliance')}
          style={({ pressed }) => pressed && styles.pressed}>
          {operations.map((op) => (
            <View key={op.label} style={[styles.opRow, styles.ruled]}>
              <View style={styles.opText}>
                <Text style={styles.opLabel}>{op.label}</Text>
                {op.hint ? <Text style={styles.opHint}>{op.hint}</Text> : null}
              </View>
              <Text style={[styles.opValue, op.accent && { color: c.primary }]}>{op.value}</Text>
            </View>
          ))}
        </Pressable>
      </View>

      <View
        style={[styles.section, styles.flush]}
        onLayout={(e) => {
          controlsY.current = e.nativeEvent.layout.y;
        }}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Platform controls
        </Text>
        {settings.isPending ? (
          <LoadingState variant="inline" />
        ) : settings.isError ? (
          <ErrorState error={settings.error} onRetry={settings.refetch} />
        ) : (
          <View style={styles.ledger}>
            {controls?.map((control) => (
              <View key={control.label} style={[styles.setting, styles.ruled]}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{control.label}</Text>
                  <Text style={[styles.settingState, control.value && styles.settingStateOn]}>
                    {control.value ? 'ON' : 'OFF'}
                  </Text>
                  <Switch
                    accessibilityLabel={control.label}
                    accessibilityHint={control.hint}
                    value={control.value}
                    onValueChange={control.onChange}
                    disabled={savePlatformSettings.isPending}
                    trackColor={{ true: c.primary, false: c.border }}
                    thumbColor={c.surface}
                    ios_backgroundColor={c.border}
                  />
                </View>
                <Text style={styles.settingHint}>{control.hint}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.footnote}>
          Featured colleges are managed separately. Changes to platform controls are audit logged.
        </Text>
      </View>

      <ActionSheet
        visible={maintenanceSheet}
        onClose={() => setMaintenanceSheet(false)}
        eyebrow="Platform control"
        title="Turn on maintenance mode?"
        message="Students and representatives will see a maintenance screen until you turn it off. Administrators keep access."
        actions={[
          {
            label: 'Turn on maintenance mode',
            destructive: true,
            onPress: () => savePlatformSettings.mutateAsync({ maintenance_mode: true }),
          },
        ]}
      />
    </ScrollView>
  );
}
