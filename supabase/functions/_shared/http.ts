import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Service-role client: bypasses RLS, so every function checks the caller itself. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

export type Caller = {
  id: string;
  role: 'student' | 'school_rep' | 'admin';
  collegeId: string | null;
};

/** Resolve the signed-in, active caller from the request's JWT, or null. */
export async function getCaller(req: Request, admin: SupabaseClient): Promise<Caller | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await admin
    .from('profiles')
    .select('role, college_id, status')
    .eq('id', data.user.id)
    .single();
  if (!profile || profile.status !== 'active') return null;
  return { id: data.user.id, role: profile.role, collegeId: profile.college_id };
}
