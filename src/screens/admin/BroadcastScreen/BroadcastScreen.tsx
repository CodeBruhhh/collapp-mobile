import { useState } from 'react';
import { Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { FormScreen } from '@/components/FormScreen';
import { LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import type { Audience } from '@/features/admin/api';
import { useAdminActions, useAuditLogs } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';
import { shortTime } from '@/lib/time';

import { createScreenStyles } from '@/screens/screenStyles';

const AUDIENCES: Record<string, Audience> = {
  Everyone: 'all',
  Students: 'student',
  Representatives: 'school_rep',
  Administrators: 'admin',
};
const AUDIENCE_LABELS = Object.fromEntries(
  Object.entries(AUDIENCES).map(([label, value]) => [value, label]),
) as Record<Audience, string>;

const TITLE_MAX = 120;
const BODY_MAX = 1000;

/** SDD screen 31 — send an announcement to everyone or one role (in-app plus push). */
export function BroadcastScreen() {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const { broadcast } = useAdminActions();
  const history = useAuditLogs('notification.broadcast');

  const [audienceLabel, setAudienceLabel] = useState('Everyone');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  function confirmSend() {
    const next = {
      title: title.trim().length < 3 ? 'Enter a title of at least 3 characters' : undefined,
      body: body.trim() ? undefined : 'Write the message',
    };
    setErrors(next);
    if (next.title || next.body) return;

    setSent(null);
    setConfirming(true);
  }

  async function send() {
    const count = await broadcast.mutateAsync([
      title.trim(),
      body.trim(),
      AUDIENCES[audienceLabel],
    ]);
    setTitle('');
    setBody('');
    setSent(`Delivered to ${count} ${count === 1 ? 'user' : 'users'}.`);
  }

  return (
    <FormScreen>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Announcements
        </Text>
        <Text style={styles.subtitle}>
          Platform announcements such as maintenance windows or application deadlines.
        </Text>
      </View>

      <ChipGroup
        label="Send to"
        options={Object.keys(AUDIENCES)}
        selected={[audienceLabel]}
        onChange={(next) => next[0] && setAudienceLabel(next[0])}
        max={1}
      />
      <TextField
        label="Title"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        maxLength={TITLE_MAX}
        hint={`${title.length}/${TITLE_MAX}`}
      />
      <TextField
        label="Message"
        value={body}
        onChangeText={setBody}
        error={errors.body}
        multiline
        maxLength={BODY_MAX}
        hint={`${body.length}/${BODY_MAX}`}
      />
      <Button label="Send broadcast" onPress={confirmSend} loading={broadcast.isPending} />
      {sent ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {sent}
        </Text>
      ) : null}

      <ActionSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        eyebrow={`To ${audienceLabel.toLowerCase()}`}
        title={title.trim() || 'Broadcast'}
        subtitle={body.trim()}
        message="It appears in their notifications right away and as a push for those who allow it. This cannot be undone."
        actions={[{ label: 'Send broadcast', onPress: send }]}
      />

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Sent broadcasts
        </Text>
        {history.isPending ? (
          <LoadingState variant="inline" />
        ) : history.data?.length ? (
          history.data.map((entry, index) => {
            const m = entry.meta as {
              title?: string;
              body?: string;
              audience?: Audience;
              recipients?: number;
            };
            return (
              <View key={entry.id} style={[styles.ledgerRow, index === 0 && styles.ledgerTop]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, styles.flex]}>{m.title}</Text>
                  <Text style={styles.meta}>{shortTime(entry.created_at)}</Text>
                </View>
                <Text style={styles.body}>{m.body}</Text>
                <Text style={styles.meta}>
                  {m.audience ? AUDIENCE_LABELS[m.audience] : 'Unknown audience'} ·{' '}
                  {m.recipients ?? 0} recipients
                </Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.meta}>Nothing sent yet.</Text>
        )}
      </View>
    </FormScreen>
  );
}
