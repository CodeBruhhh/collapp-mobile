import { supabase } from '@/lib/supabase';
import type { Tables, TablesUpdate } from '@/types/database';

export type StudentProfile = Tables<'students'>;

export async function fetchStudentProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Create-or-update the signed-in student's profile row. */
export async function saveStudentProfile(
  userId: string,
  changes: Omit<TablesUpdate<'students'>, 'user_id' | 'created_at' | 'updated_at'>,
) {
  const { error } = await supabase
    .from('students')
    .upsert({ ...changes, user_id: userId }, { onConflict: 'user_id' });
  if (error) throw error;
}

/** Display name on the account (profiles.full_name), kept in step with the student's names. */
export async function saveFullName(userId: string, fullName: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', userId);
  if (error) throw error;
}

/** Push categories a user can turn off (profiles.notification_prefs, SRS 3.1.4.4). */
export type NotificationPrefs = {
  messages: boolean;
  application_updates: boolean;
  deadlines: boolean;
};
export type NotificationCategory = keyof NotificationPrefs;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  messages: true,
  application_updates: true,
  deadlines: true,
};

export type AccountSettings = { pushEnabled: boolean; notificationPrefs: NotificationPrefs };

function parsePrefs(raw: unknown): NotificationPrefs {
  const value = (raw ?? {}) as Partial<Record<NotificationCategory, unknown>>;
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS };
  for (const key of Object.keys(prefs) as NotificationCategory[]) {
    if (typeof value[key] === 'boolean') prefs[key] = value[key];
  }
  return prefs;
}

export async function fetchAccountSettings(userId: string): Promise<AccountSettings> {
  const { data, error } = await supabase
    .from('profiles')
    .select('push_enabled, notification_prefs')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return { pushEnabled: data.push_enabled, notificationPrefs: parsePrefs(data.notification_prefs) };
}

export async function saveAccountSettings(userId: string, settings: AccountSettings) {
  const { error } = await supabase
    .from('profiles')
    .update({ push_enabled: settings.pushEnabled, notification_prefs: settings.notificationPrefs })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Confirm the current password, then set the new one. Re-signing in also
 * satisfies Supabase's "recent sign-in" rule for password changes.
 */
export async function changePassword(email: string, currentPassword: string, newPassword: string) {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInError) {
    throw signInError.code === 'invalid_credentials'
      ? new Error('Your current password is incorrect.')
      : signInError;
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
