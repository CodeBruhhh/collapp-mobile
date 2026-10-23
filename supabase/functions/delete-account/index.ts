// Account deletion (RA 10173 right to erasure, SDD screen 18). Students delete
// their own account: their files are removed from Storage, then the auth user is
// deleted and every row cascades (profile, academic profile, applications,
// documents, messages, notifications, AI data). Representative and administrator
// accounts are institutional and are removed by an administrator instead.
import { adminClient, corsHeaders, getCaller, json } from '../_shared/http.ts';

const CONFIRMATION = 'DELETE';
const LIST_LIMIT = 1000;

/** Remove every object under `{folder}/` in a bucket (one level: uploads are flat). */
async function removeFolder(admin: ReturnType<typeof adminClient>, bucket: string, folder: string) {
  const { data: files, error } = await admin.storage
    .from(bucket)
    .list(folder, { limit: LIST_LIMIT });
  if (error) throw error;
  const paths = (files ?? []).map((f) => `${folder}/${f.name}`);
  if (paths.length) {
    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw removeError;
  }
  return paths.length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = adminClient();
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: 'Not signed in' }, 401);
  if (caller.role !== 'student') {
    return json(
      { error: 'Representative and administrator accounts are removed by an administrator.' },
      403,
    );
  }

  const body = await req.json().catch(() => null);
  if (body?.confirm !== CONFIRMATION) {
    return json({ error: `Type ${CONFIRMATION} to confirm` }, 400);
  }

  try {
    // Files first: Storage objects do not cascade with database rows.
    const documents = await removeFolder(admin, 'documents', caller.id);
    const avatars = await removeFolder(admin, 'avatars', caller.id);
    const { data: sent } = await admin
      .from('messages')
      .select('attachment_path')
      .eq('sender_id', caller.id)
      .not('attachment_path', 'is', null);
    const attachmentPaths = (sent ?? []).map((m) => m.attachment_path as string);
    if (attachmentPaths.length) {
      const { error } = await admin.storage.from('attachments').remove(attachmentPaths);
      if (error) throw error;
    }

    // Keep an anonymous record that an erasure happened (no personal data).
    await admin.from('audit_logs').insert({
      action: 'profile.deleted',
      entity: 'profile',
      meta: {
        role: caller.role,
        files_removed: documents + avatars + attachmentPaths.length,
      },
    });

    const { error: deleteError } = await admin.auth.admin.deleteUser(caller.id);
    if (deleteError) throw deleteError;
  } catch (e) {
    console.error('delete-account failed', e);
    return json({ error: 'Could not delete the account. Please try again.' }, 500);
  }

  return json({ deleted: true });
});
