import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, Switch, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { ErrorState, LoadingState } from '@/components/StateView';
import { useAdminActions, useAdminStats, usePlatformSettings } from '@/features/admin/hooks';
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { CHART_MAX_BAR, createAnalyticsStyles } from './AnalyticsScreen.styles';

const STATUS_ROWS: { status: ApplicationStatus; icon: number }[] = [
  { status: 'draft', icon: require('@/assets/images/analytics/status-draft.svg') },
  { status: 'submitted', icon: require('@/assets/images/analytics/status-submitted.svg') },
  { status: 'under_review', icon: require('@/assets/images/analytics/status-under-review.svg') },
  { status: 'accepted', icon: require('@/assets/images/analytics/status-accepted.svg') },
  {
    status: 'action_required',
    icon: require('@/assets/images/analytics/status-action-required.svg'),
  },
  { status: 'rejected', icon: require('@/assets/images/analytics/status-rejected.svg') },
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
  const peak = Math.max(1, ...weeks.map((w) => w.count));
  const submittedTotal = weeks.reduce((n, w) => n + w.count, 0);

  function save(changes: Parameters<typeof savePlatformSettings.mutate>[0]) {
    savePlatformSettings.mutate(changes, {
      onError: (e) => Alert.alert('Could not update the platform', getErrorMessage(e)),
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
        <View style={styles.heading}>
          <View style={styles.titleRow}>
            <Text accessibilityRole="header" style={styles.title}>
              Platform overview
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to platform controls"
              hitSlop={4}
              onPress={() => scrollRef.current?.scrollTo({ y: controlsY.current, animated: true })}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Image
                source={require('@/assets/images/analytics/settings.svg')}
                style={{ width: 18, height: 18 }}
                tintColor={c.text}
              />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Live totals across every college.</Text>
        </View>

        <View style={styles.totals}>
          <View
            style={styles.panel}
            accessible
            accessibilityLabel={`Colleges live: ${s.colleges.published}`}>
            <Image
              source={require('@/assets/images/analytics/college-panel.svg')}
              style={styles.panelShape}
              tintColor={c.primary}
            />
            <View style={styles.panelHeading}>
              <Text style={styles.panelLabel}>Colleges live</Text>
              <Image
                source={require('@/assets/images/analytics/college.svg')}
                style={{ width: 15, height: 15 }}
                tintColor={c.onPrimary}
              />
            </View>
            <Text style={styles.panelValue} numberOfLines={1} adjustsFontSizeToFit>
              {s.colleges.published}
            </Text>
          </View>

          <View style={styles.accountTotals}>
            {accountTotals.map((t) => (
              <View
                key={t.label}
                style={styles.metric}
                accessible
                accessibilityLabel={`${t.label}: ${t.value}`}>
                <Text style={styles.metricLabel}>{t.label}</Text>
                <Text style={styles.metricValue}>{t.value}</Text>
              </View>
            ))}
          </View>
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
        <View
          style={styles.chart}
          accessible
          accessibilityLabel={`Weekly submissions: ${weeks
            .map((w) => `${weekLabel(w.week)}, ${w.count}`)
            .join('; ')}`}>
          <View style={styles.plot}>
            <View style={[styles.guide, styles.upperGuide]} />
            <View style={[styles.guide, styles.baseline]} />
            {weeks.map((w) => (
              <View key={w.week} style={styles.barColumn}>
                <Text style={[styles.barValue, w.count > 0 && styles.barValueActive]}>
                  {w.count}
                </Text>
                {w.count > 0 ? (
                  <View
                    style={[
                      styles.bar,
                      styles.barActive,
                      { height: (w.count / peak) * CHART_MAX_BAR },
                    ]}
                  />
                ) : (
                  <View style={styles.bar} />
                )}
              </View>
            ))}
          </View>
          <View style={styles.weekLabels}>
            {weeks.map((w) => (
              <Text key={w.week} style={[styles.weekLabel, w.count > 0 && styles.weekLabelActive]}>
                {weekLabel(w.week)}
              </Text>
            ))}
          </View>
        </View>
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
                <Image
                  source={icon}
                  style={styles.statusIcon}
                  tintColor={accepted ? c.primary : c.text}
                />
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
