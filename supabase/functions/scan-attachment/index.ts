// Attachment validation (SRS 3.1.4.3, SDD 5): checks every message attachment
// before other participants can download it. Verifies size, extension and that
// the file's magic bytes match its declared type, then sets scan_status.
// Antivirus scanning is not available on the free tier (documented gap).
import { adminClient, json } from '../_shared/http.ts';
import { isFromDatabase } from '../_shared/webhook.ts';

const MAX_BYTES = 10 * 1024 * 1024;

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0) =>
  sig.every((b, i) => bytes[offset + i] === b);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

/** Allowed types: extension list plus a signature check on the real bytes. */
const ALLOWED: Record<string, { ext: string[]; check: (b: Uint8Array) => boolean }> = {
  'application/pdf': { ext: ['pdf'], check: (b) => startsWith(b, ascii('%PDF-')) },
  'image/jpeg': { ext: ['jpg', 'jpeg'], check: (b) => startsWith(b, [0xff, 0xd8, 0xff]) },
  'image/png': {
    ext: ['png'],
    check: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  'image/webp': {
    ext: ['webp'],
    check: (b) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8),
  },
  'application/msword': {
    ext: ['doc'],
    check: (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: ['docx'],
    // A ZIP container holding a word/ part (rejects renamed archives).
    check: (b) =>
      startsWith(b, [0x50, 0x4b, 0x03, 0x04]) &&
      new TextDecoder('latin1').decode(b).includes('word/'),
  },
};

function verdict(name: string, mime: string, bytes: Uint8Array): string | null {
  const rule = ALLOWED[mime];
  if (!rule) return `type ${mime} is not allowed`;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (!rule.ext.includes(ext)) return `extension .${ext} does not match ${mime}`;
  if (bytes.byteLength === 0) return 'file is empty';
  if (bytes.byteLength > MAX_BYTES) return 'file is larger than 10 MB';
  if (!rule.check(bytes)) return 'file contents do not match its type';
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const admin = adminClient();
  if (!(await isFromDatabase(req, admin))) return json({ error: 'Forbidden' }, 403);

  const body = await req.json().catch(() => null);
  const messageId = typeof body?.message_id === 'string' ? body.message_id : null;
  if (!messageId) return json({ error: 'message_id is required' }, 400);

  const { data: m } = await admin
    .from('messages')
    .select('id, attachment_path, attachment_name, attachment_mime, scan_status')
    .eq('id', messageId)
    .single();
  if (!m?.attachment_path || m.scan_status !== 'pending') return json({ skipped: true });

  const { data: file, error } = await admin.storage.from('attachments').download(m.attachment_path);
  const problem = error
    ? 'file is missing'
    : verdict(
        m.attachment_name ?? '',
        m.attachment_mime ?? '',
        new Uint8Array(await file.arrayBuffer()),
      );

  const status = problem ? 'blocked' : 'clean';
  await admin.from('messages').update({ scan_status: status }).eq('id', m.id);
  if (problem) {
    await admin.from('audit_logs').insert({
      action: 'message.attachment_blocked',
      entity: 'message',
      entity_id: m.id,
      meta: { reason: problem, name: m.attachment_name },
    });
  }
  return json({ status, reason: problem });
});
