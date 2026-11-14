// Admin-only: add another representative to an existing college.
// Reps never self-register (SRS 3.1.3); this runs with the service role so the
// key never ships in the mobile app.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const bodySchema = z.object({
  collegeId: z.uuid(),
  rep: z.object({
    fullName: z.string().trim().min(2).max(200),
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z
      .string()
      .min(8)
      .regex(/[A-Za-z]/)
      .regex(/[0-9]/),
  }),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );

  // Only active administrators may call this.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not signed in' }, 401);
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: 'Not signed in' }, 401);
  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role, status')
    .eq('id', caller.user.id)
    .single();
  if (callerProfile?.role !== 'admin' || callerProfile.status !== 'active') {
    return json({ error: 'Administrators only' }, 403);
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: 'Invalid input', issues: z.flattenError(parsed.error).fieldErrors }, 400);
  }
  const { collegeId, rep } = parsed.data;

  const { data: college } = await admin
    .from('colleges')
    .select('id, name')
    .eq('id', collegeId)
    .maybeSingle();
  if (!college) return json({ error: 'College not found' }, 404);

  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email: rep.email,
    password: rep.password,
    email_confirm: true,
    user_metadata: { full_name: rep.fullName },
  });
  if (userError || !createdUser.user) {
    return json({ error: userError?.message ?? 'Could not create the representative' }, 400);
  }

  // The sign-up trigger made a student profile; promote it to this college's rep.
  const { error: promoteError } = await admin
    .from('profiles')
    .update({ role: 'school_rep', college_id: college.id, full_name: rep.fullName })
    .eq('id', createdUser.user.id);
  if (promoteError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return json({ error: promoteError.message }, 400);
  }

  await admin.from('audit_logs').insert({
    actor_id: caller.user.id,
    action: 'college.rep_added',
    entity: 'college',
    entity_id: college.id,
    meta: { rep_id: createdUser.user.id, rep_email: rep.email },
  });

  return json({ repId: createdUser.user.id, college }, 201);
});
