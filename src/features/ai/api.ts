import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/** Surface the Edge Function's own `{ error }` message instead of a generic HTTP error. */
async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body: body ?? {} });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw error;
  }
  return data as T;
}

type RecommendResult = { count: number; generated_at: string; pending: number };

/** Each call embeds a few new programs (Edge CPU limit); these extra passes finish the rest. */
const MAX_EMBED_PASSES = 5;

/** Re-run the AI Exploration Engine for the signed-in student (SRS 3.1.1.2). */
export async function refreshRecommendations() {
  let result = await invoke<RecommendResult>('ai-recommend');
  for (let pass = 1; pass < MAX_EMBED_PASSES && result.pending > 0; pass++) {
    result = await invoke<RecommendResult>('ai-recommend');
  }
  return result;
}

export async function listRecommendations(userId: string) {
  const { data, error } = await supabase
    .from('ai_recommendations')
    .select(
      `id, match_score, reasons, generated_at,
       college:colleges(id, name, city, province, region, logo_path),
       program:programs(id, name, deadline, is_open)`,
    )
    .eq('student_id', userId)
    .order('match_score', { ascending: false });
  if (error) throw error;
  return data.map((r) => ({ ...r, reasons: (r.reasons as string[] | null) ?? [] }));
}
export type Recommendation = Awaited<ReturnType<typeof listRecommendations>>[number];

/** Ask the AI Applicant Scoring function to (re)score one application (SRS 3.1.2.2). */
export function scoreApplication(applicationId: string) {
  return invoke<{ ok: boolean; fit_score?: number; enrollment_likelihood?: number }>('ai-score', {
    applicationId,
  });
}
