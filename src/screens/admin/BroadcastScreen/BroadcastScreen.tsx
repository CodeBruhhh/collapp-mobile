import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChipGroup } from '@/components/ChipGroup';
import { FormScreen } from '@/components/FormScreen';
import { LoadingState } from '@/components/StateView';
import { TextField } from '@/components/TextField';
import type { Audience } from '@/features/admin/api';
import { useAdminActions, useAuditLogs } from '@/features/admin/hooks';
import { useTheme } from '@/hooks/useTheme';
import { shortTime } from '@/lib/time';
import { getErrorMessage } from '@/lib/validation';

import { createAdminStyles } from '../adminStyles';

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
  const styles = createAdminStyles(colors);
  const { broadcast } = useAdminActions();
  const history = useAuditLogs('notification.broadcast');

  const [audienceLabel, setAudienceLabel] = useState('Everyone');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  function confirmSend() {
    const next = {
      title: title.trim().length < 3 ? 'Enter a title of at least 3 characters' : undefined,
      body: body.trim() ? undefined : 'Write the message',
    };
    setErrors(next);
    if (next.title || next.body) return;

    Alert.alert(
      `Send to ${audienceLabel.toLowerCase()}?`,
      'It appears in their notifications right away and as a push for those who allow it. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              const count = await broadcast.mutateAsync([
                title.trim(),
                body.trim(),
                AUDIENCES[audienceLabel],
              ]);
              setTitle('');
              setBody('');
              Alert.alert(
                'Broadcast sent',
                `Delivered to ${count} ${count === 1 ? 'user' : 'users'}.`,
              );
            } catch (e) {
              Alert.alert('Could not send', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <FormScreen>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          Broadcast
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sent broadcasts</Text>
        {history.isPending ? (
          <LoadingState />
        ) : history.data?.length ? (
          history.data.map((entry) => {
            const m = entry.meta as {
              title?: string;
              body?: string;
              audience?: Audience;
              recipients?: number;
            };
            return (
              <Card key={entry.id}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, styles.flex]}>{m.title}</Text>
                  <Text style={styles.meta}>{shortTime(entry.created_at)}</Text>
                </View>
                <Text style={styles.body}>{m.body}</Text>
                <Text style={styles.meta}>
                  {m.audience ? AUDIENCE_LABELS[m.audience] : 'Unknown audience'} ·{' '}
                  {m.recipients ?? 0} recipients
                </Text>
              </Card>
            );
          })
        ) : (
          <Text style={styles.meta}>Nothing sent yet.</Text>
        )}
      </View>
    </FormScreen>
  );
}
