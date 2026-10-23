import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { FilterTabs } from '@/components/FilterTabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateView';
import { StatusBadge } from '@/components/StatusBadge';
import type { AuditEntry } from '@/features/admin/api';
import { useAuditLogs, useBlockedAttachments, useRlsOverview } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';
import { shortTime } from '@/lib/time';

import { createAdminStyles } from '../adminStyles';

type Section = 'audit' | 'blocked' | 'rls';
type AuditFilter =
  'all' | 'application.' | 'profile.' | 'college.' | 'platform.' | 'message.' | 'notification.';

const ACTION_LABELS: Record<string, string> = {
  'application.status_changed': 'Application status changed',
  'profile.access_changed': 'Account access changed',
  'college.created': 'College created',
  'college.status_changed': 'College publish status changed',
  'platform.settings_changed': 'Platform settings changed',
  'message.attachment_blocked': 'Attachment blocked',
  'notification.broadcast': 'Broadcast sent',
};

/** One readable line describing what changed. */
function describe(entry: AuditEntry): string {
  const m = (entry.meta ?? {}) as Record<string, unknown>;
  switch (entry.action) {
    case 'application.status_changed':
    case 'college.status_changed':
      return `${String(m.from)} → ${String(m.to)}`;
    case 'profile.access_changed': {
      const status = m.status as [string, string] | undefined;
      const role = m.role as [string, string] | undefined;
      return [
        status && status[0] !== status[1] ? `status ${status[0]} → ${status[1]}` : null,
        role && role[0] !== role[1] ? `role ${role[0]} → ${role[1]}` : null,
      ]
        .filter(Boolean)
        .join(', ');
    }
    case 'college.created':
      return `Representative: ${String(m.rep_email ?? '')}`;
    case 'message.attachment_blocked':
      return `${String(m.name ?? 'file')}: ${String(m.reason ?? '')}`;
    case 'notification.broadcast':
      return `"${String(m.title)}" to ${String(m.audience)} (${String(m.recipients)} users)`;
    case 'platform.settings_changed':
      return Object.entries(m)
        .filter(([, v]) => Array.isArray(v) && JSON.stringify(v[0]) !== JSON.stringify(v[1]))
        .map(([k, v]) =>
          k === 'featured_college_ids'
            ? 'featured colleges updated'
            : `${k.replace(/_/g, ' ')} ${String((v as unknown[])[0])} → ${String((v as unknown[])[1])}`,
        )
        .join(', ');
    default:
      return '';
  }
}

/** SDD screens 29-30 — audit trail, flagged attachments and tenant/RLS oversight. */
export function ComplianceScreen() {
  const { colors } = useTheme();
  const styles = createAdminStyles(colors);
  const [section, setSection] = useState<Section>('audit');
  const [auditFilter, setAuditFilter] = useState<AuditFilter>('all');

  const audit = useAuditLogs(auditFilter === 'all' ? null : auditFilter);
  const blocked = useBlockedAttachments();
  const rls = useRlsOverview();

  const header = (
    <View style={styles.section}>
      <FilterTabs<Section>
        value={section}
        onChange={setSection}
        options={[
          { value: 'audit', label: 'Audit log' },
          { value: 'blocked', label: 'Blocked files', count: blocked.data?.length },
          { value: 'rls', label: 'Data access (RLS)' },
        ]}
      />
      {section === 'audit' ? (
        <FilterTabs<AuditFilter>
          value={auditFilter}
          onChange={setAuditFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'application.', label: 'Applications' },
            { value: 'profile.', label: 'Accounts' },
            { value: 'college.', label: 'Colleges' },
            { value: 'platform.', label: 'Platform' },
            { value: 'message.', label: 'Messages' },
            { value: 'notification.', label: 'Broadcasts' },
          ]}
        />
      ) : null}
      {section === 'rls' ? (
        <Text style={styles.meta}>
          Every table must have row-level security on. Policies decide which rows each role can read
          or change.
        </Text>
      ) : null}
    </View>
  );

  if (section === 'audit') {
    return (
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={audit.data ?? []}
        keyExtractor={(e) => String(e.id)}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={audit.isRefetching} onRefresh={audit.refetch} />
        }
        ListEmptyComponent={
          audit.isPending ? (
            <LoadingState />
          ) : audit.isError ? (
            <ErrorState error={audit.error} onRetry={audit.refetch} />
          ) : (
            <EmptyState icon="document-text-outline" title="No audit entries" />
          )
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, styles.flex]}>
                {ACTION_LABELS[item.action] ?? item.action}
              </Text>
              <Text style={styles.meta}>{shortTime(item.created_at)}</Text>
            </View>
            {describe(item) ? <Text style={styles.body}>{describe(item)}</Text> : null}
            <Text style={styles.meta}>
              By {item.actor ? item.actor.full_name || item.actor.email : 'the system'}
            </Text>
          </Card>
        )}
      />
    );
  }

  if (section === 'blocked') {
    return (
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={blocked.data ?? []}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        refreshControl={
          <RefreshControl refreshing={blocked.isRefetching} onRefresh={blocked.refetch} />
        }
        ListEmptyComponent={
          blocked.isPending ? (
            <LoadingState />
          ) : blocked.isError ? (
            <ErrorState error={blocked.error} onRetry={blocked.refetch} />
          ) : (
            <EmptyState icon="shield-checkmark-outline" title="No blocked attachments" />
          )
        }
        renderItem={({ item }) => (
          <Card
            onPress={() =>
              router.push({ pathname: '/admin/thread/[id]', params: { id: item.thread_id } })
            }
            accessibilityLabel={`Blocked file ${item.attachment_name}. Open conversation`}>
            <View style={styles.row}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
              <View style={styles.flex}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.attachment_name}
                </Text>
                <Text style={styles.meta}>
                  {item.sender ? item.sender.full_name || item.sender.email : 'Unknown sender'} ·{' '}
                  {shortTime(item.created_at)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
      data={rls.data ?? []}
      keyExtractor={(t) => t.table_name}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={rls.isRefetching} onRefresh={rls.refetch} />}
      ListEmptyComponent={
        rls.isPending ? (
          <LoadingState />
        ) : rls.isError ? (
          <ErrorState error={rls.error} onRetry={rls.refetch} />
        ) : null
      }
      renderItem={({ item }) => (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, styles.flex]}>{item.table_name}</Text>
            <StatusBadge
              label={item.rls_enabled ? 'RLS on' : 'RLS OFF'}
              color={item.rls_enabled ? colors.status.accepted : colors.danger}
            />
          </View>
          <Text style={styles.meta}>
            {item.policy_count === 0
              ? 'No policies: only the server can access it'
              : `${item.policy_count} ${item.policy_count === 1 ? 'policy' : 'policies'}`}
          </Text>
          {item.policies.map((p) => (
            <Text key={p} style={styles.meta}>
              • {p}
            </Text>
          ))}
        </Card>
      )}
    />
  );
}
