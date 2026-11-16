// Admin-only: create another administrator account.
// Admins never self-register (SRS 3.1.3); this runs with the service role so the
// key never ships in the mobile app.
import { z } from 'npm:zod@4';

import { adminClient, corsHeaders, getCaller, json } from '../_shared/http.ts';

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = adminClient();

  // Only active administrators may call this.
  const caller = await getCaller(req, admin);
  if (!caller) return json({ error: 'Not signed in' }, 401);
  if (caller.role !== 'admin') return json({ error: 'Administrators only' }, 403);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: 'Invalid input', issues: z.flattenError(parsed.error).fieldErrors }, 400);
  }
  const { fullName, email, password } = parsed.data;

  const { data: createdUser, error: userError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (userError || !createdUser.user) {
    return json({ error: userError?.message ?? 'Could not create the administrator' }, 400);
  }

  // The sign-up trigger made a student profile; promote it.
  const { error: promoteError } = await admin
    .from('profiles')
    .update({ role: 'admin', college_id: null, full_name: fullName })
    .eq('id', createdUser.user.id);
  if (promoteError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return json({ error: promoteError.message }, 400);
  }

  await admin.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'profile.admin_created',
    entity: 'profile',
    entity_id: createdUser.user.id,
    meta: { admin_email: email },
  });

  return json({ adminId: createdUser.user.id }, 201);
});
