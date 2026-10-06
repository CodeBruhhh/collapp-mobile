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
