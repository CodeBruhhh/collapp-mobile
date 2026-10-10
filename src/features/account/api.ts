import { FunctionsHttpError } from '@supabase/supabase-js';
import { Directory } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import type { Role } from '@/types/roles';

const EXPORT_FORMAT_VERSION = 1;

/** Throw on error, otherwise return the rows (keeps the export builder flat). */
function rows<T>(result: { data: T | null; error: unknown }): T | null {
  if (result.error) throw result.error;
  return result.data;
}

/**
 * Everything CollApp stores about the signed-in user, as one JSON document
 * (RA 10173 right to data portability). Uploaded files are listed by name; they
 * can be downloaded from the app while the account exists.
 */
export async function buildDataExport(userId: string, role: Role) {
  const isStudent = role === 'student';
  const [
    account,
    student,
    applications,
    follows,
    recommendations,
    messages,
    notifications,
    devices,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, full_name, email, status, push_enabled, notification_prefs, created_at')
      .eq('id', userId)
      .single(),
    isStudent
      ? supabase.from('students').select('*').eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    isStudent
      ? supabase
          .from('applications')
          .select(
            `id, status, essay, submitted_at, decided_at, decision_message, created_at, updated_at,
               college:colleges(name),
               program:programs!applications_program_id_fkey(name),
               second_program:programs!applications_second_program_id_fkey(name),
               final_program:programs!applications_final_program_id_fkey(name),
               documents(label, mime_type, size_bytes, review_status, review_notes, created_at)`,
          )
          .eq('student_id', userId)
      : Promise.resolve({ data: [], error: null }),
    isStudent
      ? supabase
          .from('follows')
          .select('created_at, college:colleges(name)')
          .eq('student_id', userId)
      : Promise.resolve({ data: [], error: null }),
    isStudent
      ? supabase
          .from('ai_recommendations')
          .select(
            'match_score, reasons, generated_at, college:colleges(name), program:programs(name)',
          )
          .eq('student_id', userId)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('messages')
      .select('thread_id, body, attachment_name, created_at')
      .eq('sender_id', userId)
      .order('created_at'),
    supabase
      .from('notifications')
      .select('type, title, body, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at'),
    supabase.from('push_tokens').select('platform, updated_at').eq('user_id', userId),
  ]);

  return {
    app: 'CollApp',
    format_version: EXPORT_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    account: rows(account),
    academic_profile: rows(student),
    applications: rows(applications),
    saved_colleges: rows(follows),
    ai_recommendations: rows(recommendations),
    messages_sent: rows(messages),
    notifications: rows(notifications),
    registered_devices: rows(devices),
  };
}

/**
 * Ask where to save, then write the export there. Resolves the file name, or
 * null when the person cancels the folder picker.
 */
export async function saveDataExport(data: unknown): Promise<string | null> {
  let directory: Directory;
  try {
    directory = await Directory.pickDirectoryAsync();
  } catch (e) {
    if (e instanceof Error && /cancel/i.test(e.message)) return null;
    throw e;
  }
  const name = `collapp-data-${new Date().toISOString().slice(0, 10)}.json`;
  const file = directory.createFile(name, 'application/json');
  file.write(JSON.stringify(data, null, 2));
  return name;
}

/** Permanently delete the signed-in student's account (delete-account Edge Function). */
export async function deleteMyAccount() {
  const { error } = await supabase.functions.invoke('delete-account', {
    body: { confirm: 'DELETE' },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw error;
  }
}
