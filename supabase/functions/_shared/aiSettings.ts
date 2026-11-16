import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** Quota kinds counted in private.ai_usage; limits are set per role by admins. */
export type AiKind = 'document_check_auto' | 'document_check' | 'essay_feedback' | 'essay_summary';

export const AI_PAUSED_MESSAGE = 'AI checks are paused by a CollApp administrator.';
export const AI_LIMIT_MESSAGE =
  'You have reached today’s AI limit. It resets at midnight (Philippine time).';

/** Admins can pause every Gemini call from the AI monitor. */
export async function aiEnabled(admin: SupabaseClient): Promise<boolean> {
  const { data, error } = await admin.from('platform_settings').select('ai_enabled').maybeSingle();
  return error || !data ? true : data.ai_enabled !== false;
}

export type QuotaResult = { allowed: boolean; used: number; limit: number | null };

/**
 * Count one use against the person's role limit (use_ai_quota never counts past
 * it). If the database call itself fails, allow the request rather than block AI.
 */
export async function useQuota(
  admin: SupabaseClient,
  userId: string,
  kind: AiKind,
): Promise<QuotaResult> {
  const { data, error } = await admin.rpc('use_ai_quota', { p_user: userId, p_kind: kind });
  if (error || !data) {
    console.error('use_ai_quota failed', error?.message);
    return { allowed: true, used: 0, limit: null };
  }
  return data as QuotaResult;
}

/** Give the use back when the AI call failed, so people only pay for results. */
export async function refundQuota(admin: SupabaseClient, userId: string, kind: AiKind) {
  const { error } = await admin.rpc('refund_ai_quota', { p_user: userId, p_kind: kind });
  if (error) console.error('refund_ai_quota failed', error.message);
}
