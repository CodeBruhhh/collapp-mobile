import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type AppNotification = Pick<
  Tables<'notifications'>,
  'id' | 'type' | 'title' | 'body' | 'data' | 'read_at' | 'created_at'
>;

const PAGE_SIZE = 100;

export async function listNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, body, data, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return data;
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  let query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);
  if (ids) query = query.in('id', ids);
  const { error } = await query;
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}
