// Push dispatch (SRS 3.1.4.2, SDD 5): delivers one notification row to the
// recipient's devices through the Expo Push API. Triggered by the database on
// every notification insert when the user has push enabled and a device token.
import { adminClient, json } from '../_shared/http.ts';
import { isFromDatabase } from '../_shared/webhook.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const admin = adminClient();
  if (!(await isFromDatabase(req, admin))) return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => null);
  const notificationId = typeof body?.notification_id === 'string' ? body.notification_id : null;
  if (!notificationId) return json({ error: 'notification_id is required' }, 400);

  const { data: n } = await admin
    .from('notifications')
    .select('id, user_id, type, title, body, data, profile:profiles(push_enabled, status)')
    .eq('id', notificationId)
    .single();
  const profile = n?.profile as { push_enabled: boolean; status: string } | null;
  if (!n || !profile?.push_enabled || profile.status !== 'active') return json({ sent: 0 });

  const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', n.user_id);
  if (!tokens?.length) return json({ sent: 0 });

  const messages = tokens.map(({ token }) => ({
    to: token,
    title: n.title,
    body: n.body || undefined,
    sound: 'default',
    channelId: 'default',
    priority: 'high',
    data: { ...(n.data as Record<string, unknown>), type: n.type, notification_id: n.id },
  }));

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  if (!res.ok) {
    console.error('expo push failed', res.status, await res.text());
    return json({ error: 'Push service unavailable' }, 502);
  }

  // Drop tokens of uninstalled apps so they are not retried forever.
  const { data: tickets } = (await res.json()) as { data: Ticket[] };
  const dead = tickets
    .map((t, i) => (t.details?.error === 'DeviceNotRegistered' ? tokens[i].token : null))
    .filter((t): t is string => t !== null);
  if (dead.length) await admin.from('push_tokens').delete().in('token', dead);

  return json({ sent: tickets.filter((t) => t.status === 'ok').length, removed: dead.length });
});
