import { Stack } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Switch, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { BarChart } from '@/components/BarChart';
import { Button } from '@/components/Button';
import { MetricPanel } from '@/components/MetricPanel';
import { MetricRows } from '@/components/MetricRow';
import { PageHeading } from '@/components/PageHeading';
import { ErrorState, LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import {
  ROLE_AI_KINDS,
  type AiKind,
  type AiLimits,
  type AiOverview,
  type LimitedRole,
} from '@/features/admin/api';
import { useAdminActions, useAiOverview } from '@/features/admin/hooks';
import { aiLimitSchema } from '@/features/admin/schemas';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { shortTime } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';
import { ROLE_LABELS } from '@/types/roles';

import { createAnalyticsStyles } from '@/screens/admin/AnalyticsScreen/AnalyticsScreen.styles';

const KINDS: { kind: AiKind; label: string; hint: string }[] = [
  {
    kind: 'document_check_auto',
    label: 'Automatic document checks',
    hint: 'Run on every upload, charged once per file to the student',
  },
  {
    kind: 'document_check',
    label: 'Manual re-checks',
    hint: '"Check again" by a student or representative',
  },
  { kind: 'essay_feedback', label: 'Essay feedback', hint: 'Students asking for drafting help' },
  {
    kind: 'essay_summary',
    label: 'Essay summaries',
    hint: 'Representatives asking for or regenerating a summary',
  },
];

const ROLE_GROUPS: { role: LimitedRole; title: string }[] = [
  { role: 'student', title: 'Students' },
  { role: 'school_rep', title: 'Representatives' },
];

/** Saved limits over the built-in defaults, per role. */
function mergeLimits(o: AiOverview): AiLimits {
  return {
    student: { ...o.settings.defaults.student, ...o.settings.limits.student },
    school_rep: { ...o.settings.defaults.school_rep, ...o.settings.limits.school_rep },
  };
}

/** "students 30 · reps 100" for the roles that use this kind. */
function limitText(limits: AiLimits, kind: AiKind) {
  return ROLE_GROUPS.filter(({ role }) => ROLE_AI_KINDS[role].includes(kind))
    .map(({ role }) => `${role === 'student' ? 'students' : 'reps'} ${limits[role][kind] ?? 0}`)
    .join(' · ');
}

const KIND_LABELS = Object.fromEntries(KINDS.map((k) => [k.kind, k.label])) as Record<
  AiKind,
  string
>;

/** `2026-11-16` -> `16`, without a timezone round-trip. */
const dayLabel = (day: string) => String(Number(day.slice(8, 10)));

const count = (n: number | undefined) => n ?? 0;

/** Gemini usage, results and failures, plus the AI switch and daily limits. */
export function AiMonitorScreen() {
  const { colors: c } = useTheme();
  const styles = createAnalyticsStyles(c);
  const overview = useAiOverview();

  if (overview.isPending) return <LoadingState variant="detail" />;
  if (overview.isError) return <ErrorState error={overview.error} onRetry={overview.refetch} />;

  const o = overview.data;
  const limits = mergeLimits(o);
  const usesToday = KINDS.reduce((n, k) => n + count(o.today[k.kind]), 0);
  const fortnight = o.daily.reduce((n, d) => n + d.count, 0);
  const docs = o.documents.by_status;
  const verdicts = o.documents.by_verdict;
  const models = Object.entries(o.models).sort((a, b) => b[1] - a[1]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          tintColor={c.primary}
          colors={[c.primary]}
          refreshing={overview.isRefetching}
          onRefresh={overview.refetch}
        />
      }>
      <Stack.Screen options={{ title: 'AI usage' }} />
      <View style={styles.overview}>
        <PageHeading
          title="AI usage"
          subtitle="Gemini document checks and essay feedback across every college."
        />
        <View style={styles.totals}>
          <MetricPanel
            label="Uses today"
            value={usesToday}
            icon="sparkles"
            caption={o.settings.enabled ? 'AI is on' : 'AI is paused'}
          />
          <MetricRows
            metrics={[
              { label: 'Last 14 days', value: fortnight },
              { label: 'Waiting to retry', value: o.queue.waiting },
              { label: 'Gave up', value: o.queue.gave_up },
            ]}
          />
        </View>
      </View>

      <AiSwitch enabled={o.settings.enabled} />

      <View style={[styles.section, styles.sheet]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Daily uses
        </Text>
        <BarChart
          title="AI uses per day"
          bars={o.daily.map((d) => ({ key: d.day, label: dayLabel(d.day), value: d.count }))}
        />
      </View>

      <View style={[styles.section, styles.flush]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Today by type
        </Text>
        <View>
          {KINDS.map(({ kind, label, hint }) => (
            <View key={kind} style={[styles.opRow, styles.ruled]}>
              <View style={styles.opText}>
                <Text style={styles.opLabel}>{label}</Text>
                <Text style={styles.opHint}>
                  {hint} · daily limit: {limitText(limits, kind)}
                </Text>
              </View>
              <Text style={styles.opValue}>{count(o.today[kind])}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.flush]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Results, last 7 days
        </Text>
        <ResultRows
          rows={[
            { label: 'Documents: looks right', value: count(verdicts.pass), accent: true },
            { label: 'Documents: take a second look', value: count(verdicts.review) },
            { label: 'Documents: may be the wrong file', value: count(verdicts.fail) },
            { label: 'Document checks still running', value: count(docs.pending) },
            { label: 'Document checks failed', value: count(docs.failed), danger: true },
            { label: 'Document checks skipped', value: count(docs.skipped) },
            { label: 'Essay summaries done', value: count(o.essays.done) },
            {
              label: 'Essay summaries failed or skipped',
              value: count(o.essays.failed) + count(o.essays.skipped),
              danger: true,
            },
          ]}
        />
        <Text style={styles.footnote}>
          Skipped means a daily limit was reached, AI was paused, or the file could not be read.
        </Text>
        <RetryButton overview={o} />
      </View>

      <View style={[styles.section, styles.flush]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Models used, last 7 days
        </Text>
        {models.length ? (
          <ResultRows rows={models.map(([model, n]) => ({ label: model, value: n }))} />
        ) : (
          <Text style={styles.opHint}>No AI results in the last 7 days.</Text>
        )}
        <Text style={styles.footnote}>
          The second model only runs when the first is rate-limited or unavailable.
        </Text>
      </View>

      <View style={[styles.section, styles.flush]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Heaviest users today
        </Text>
        {o.top_users.length ? (
          <View>
            {o.top_users.map((u) => (
              <View key={`${u.id}-${u.kind}`} style={[styles.opRow, styles.ruled]}>
                <View style={styles.opText}>
                  <Text style={styles.opLabel} numberOfLines={1}>
                    {u.full_name || u.email}
                  </Text>
                  <Text style={styles.opHint} numberOfLines={1}>
                    {ROLE_LABELS[u.role]} · {KIND_LABELS[u.kind] ?? u.kind}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.opValue,
                    u.role !== 'admin' &&
                      u.count >= (limits[u.role][u.kind] ?? Infinity) && { color: c.danger },
                  ]}>
                  {u.count}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.opHint}>Nobody has used AI today.</Text>
        )}
      </View>

      <View style={[styles.section, styles.flush]}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Recent errors
        </Text>
        {o.recent_errors.length ? (
          <View>
            {o.recent_errors.map((e, i) => (
              <View key={`${e.occurred_at}-${i}`} style={[styles.setting, styles.ruled]}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    {e.kind === 'document' ? 'Document check' : 'Essay summary'} · {e.status}
                  </Text>
                  <Text style={styles.opHint}>{shortTime(e.occurred_at)}</Text>
                </View>
                <Text style={styles.settingHint}>{e.error}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.opHint}>No errors. Every recent AI job finished.</Text>
        )}
      </View>

      <LimitsForm limits={limits} resetsAt={o.settings.resets_at} />
    </ScrollView>
  );
}

function ResultRows({
  rows,
}: {
  rows: { label: string; value: number; accent?: boolean; danger?: boolean }[];
}) {
  const { colors: c } = useTheme();
  const styles = createAnalyticsStyles(c);
  return (
    <View>
      {rows.map((r) => (
        <View
          key={r.label}
          style={[styles.statusRow, styles.ruled]}
          accessible
          accessibilityLabel={`${r.label}: ${r.value}`}>
          <Text style={[styles.statusLabel, r.accent && styles.statusLabelAccent]}>{r.label}</Text>
          <Text
            style={[
              styles.statusCount,
              r.value > 0 && styles.countActive,
              r.danger && r.value > 0 && { color: c.danger },
            ]}>
            {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Pausing stops every Gemini call; uploads still work and checks show as skipped. */
function AiSwitch({ enabled }: { enabled: boolean }) {
  const { colors: c } = useTheme();
  const styles = createAnalyticsStyles(c);
  const { saveAiSettings } = useAdminActions();
  const [confirmPause, setConfirmPause] = useState(false);

  function change(on: boolean) {
    if (!on) return setConfirmPause(true);
    saveAiSettings.mutate(
      { ai_enabled: true },
      {
        onSuccess: () => notify.success('AI checks are back on'),
        onError: (e) => notify.error('Could not turn AI on', getErrorMessage(e)),
      },
    );
  }

  return (
    <View style={[styles.section, styles.flush]}>
      <View style={styles.ledger}>
        <View style={[styles.setting, styles.ruled]}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>AI checks and feedback</Text>
            <Text style={[styles.settingState, enabled && styles.settingStateOn]}>
              {enabled ? 'ON' : 'PAUSED'}
            </Text>
            <Switch
              accessibilityLabel="AI checks and feedback"
              accessibilityHint="Pauses or resumes every Gemini call"
              value={enabled}
              onValueChange={change}
              disabled={saveAiSettings.isPending}
              trackColor={{ true: c.primary, false: c.border }}
              thumbColor={c.surface}
              ios_backgroundColor={c.border}
            />
          </View>
          <Text style={styles.settingHint}>
            Pause if the free quota runs out or Gemini misbehaves. Uploads keep working; their
            checks are marked as skipped and can be retried later.
          </Text>
        </View>
      </View>

      <ActionSheet
        visible={confirmPause}
        onClose={() => setConfirmPause(false)}
        eyebrow="AI control"
        title="Pause AI checks?"
        message="Document checks, essay feedback and essay summaries stop for everyone until you turn them back on. Representatives still review documents themselves."
        actions={[
          {
            label: 'Pause AI',
            destructive: true,
            onPress: () => saveAiSettings.mutateAsync({ ai_enabled: false }),
          },
        ]}
      />
    </View>
  );
}

function RetryButton({ overview }: { overview: AiOverview }) {
  const { retryAi } = useAdminActions();
  const failed =
    count(overview.documents.by_status.failed) +
    count(overview.documents.by_status.skipped) +
    count(overview.essays.failed) +
    count(overview.essays.skipped);

  return (
    <Button
      variant="secondary"
      label="Retry failed and skipped checks"
      disabled={!overview.settings.enabled || failed === 0}
      loading={retryAi.isPending}
      onPress={() =>
        retryAi.mutate(undefined, {
          onSuccess: (n) =>
            notify.success(
              n ? `Retrying ${n} ${n === 1 ? 'check' : 'checks'}` : 'Nothing to retry',
              n ? 'Results appear in a minute or two.' : undefined,
            ),
          onError: (e) => notify.error('Could not retry', getErrorMessage(e)),
        })
      }
    />
  );
}

type LimitForm = Record<LimitedRole, Partial<Record<AiKind, string>>>;

const toForm = (limits: AiLimits): LimitForm => ({
  student: Object.fromEntries(
    ROLE_AI_KINDS.student.map((k) => [k, String(limits.student[k] ?? 0)]),
  ),
  school_rep: Object.fromEntries(
    ROLE_AI_KINDS.school_rep.map((k) => [k, String(limits.school_rep[k] ?? 0)]),
  ),
});

function LimitsForm({ limits, resetsAt }: { limits: AiLimits; resetsAt: string }) {
  const { colors: c } = useTheme();
  const styles = createAnalyticsStyles(c);
  const { saveAiSettings } = useAdminActions();
  const [form, setForm] = useState<LimitForm>(() => toForm(limits));
  const [errors, setErrors] = useState<LimitForm>({ student: {}, school_rep: {} });

  const saved = toForm(limits);
  const changed = ROLE_GROUPS.some(({ role }) =>
    ROLE_AI_KINDS[role].some((k) => (form[role][k] ?? '').trim() !== saved[role][k]),
  );

  function save() {
    const next: AiLimits = { student: {}, school_rep: {} };
    const nextErrors: LimitForm = { student: {}, school_rep: {} };
    let invalid = false;
    for (const { role } of ROLE_GROUPS) {
      for (const kind of ROLE_AI_KINDS[role]) {
        const parsed = aiLimitSchema.safeParse((form[role][kind] ?? '').trim());
        if (parsed.success) next[role][kind] = parsed.data;
        else {
          nextErrors[role][kind] = parsed.error.issues[0]?.message;
          invalid = true;
        }
      }
    }
    setErrors(nextErrors);
    if (invalid) return;
    saveAiSettings.mutate(
      { ai_limits: next },
      {
        onSuccess: () => notify.success('Daily limits saved', 'They apply to the next AI request.'),
        onError: (e) => notify.error('Could not save the limits', getErrorMessage(e)),
      },
    );
  }

  const resetTime = new Date(resetsAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={[styles.section, styles.flush]}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Daily limits per person
      </Text>
      <Text style={styles.opHint}>
        Keeps the shared Gemini quota fair. Students and representatives see their own limits next
        to each AI button and in Settings. 0 turns that type off. Limits reset at midnight
        Philippine time ({resetTime} on this device), failed AI requests are not counted, and
        administrators are not limited.
      </Text>
      {ROLE_GROUPS.map(({ role, title }) => (
        <View key={role} style={styles.limitGroup}>
          <Text style={styles.settingLabel}>{title}</Text>
          {ROLE_AI_KINDS[role].map((kind) => (
            <TextField
              key={kind}
              label={KIND_LABELS[kind]}
              value={form[role][kind] ?? ''}
              onChangeText={(v) =>
                setForm((f) => ({
                  ...f,
                  [role]: { ...f[role], [kind]: v.replace(/[^0-9]/g, '') },
                }))
              }
              error={errors[role][kind]}
              keyboardType="number-pad"
              maxLength={4}
            />
          ))}
        </View>
      ))}
      <Button
        label="Save limits"
        onPress={save}
        disabled={!changed}
        loading={saveAiSettings.isPending}
      />
    </View>
  );
}
