// Read-only look at the database before seeding (no writes).
// Run: node --env-file=.env.local --env-file=.env.seed scripts/demo-seed/inspect.mjs
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: colleges, error } = await db
  .from('colleges')
  .select('id, name, city, profile_status, logo_path, programs(count), posts(count)')
  .order('name');
if (error) throw error;
console.log(`colleges (${colleges.length}):`);
for (const c of colleges) {
  console.log(
    `  - ${c.name} | ${c.city ?? '-'} | ${c.profile_status} | logo:${c.logo_path ? 'y' : 'n'} | programs:${c.programs[0].count} | posts:${c.posts[0].count}`,
  );
}

const { data: profiles } = await db.from('profiles').select('role, status, email');
const byRole = {};
for (const p of profiles ?? []) byRole[p.role] = (byRole[p.role] ?? 0) + 1;
console.log('profiles by role:', byRole);
console.log(
  'demo accounts already present:',
  (profiles ?? []).filter((p) => p.email.startsWith('demo.') && p.email.endsWith('@example.com')).length,
);
console.log('active admins:', (profiles ?? []).filter((p) => p.role === 'admin' && p.status === 'active').length);

for (const table of ['applications', 'documents', 'posts', 'threads', 'messages']) {
  const { count } = await db.from(table).select('*', { count: 'exact', head: true });
  console.log(`${table}: ${count}`);
}

// Demo data, if seeded: applications per school and how the AI checks are going.
const { data: demoApps } = await db
  .from('applications')
  .select('status, college:colleges(name), student:students!inner(profile:profiles!inner(email))')
  .like('student.profile.email', 'demo.%@example.com');
if (demoApps?.length) {
  const perSchool = {};
  for (const a of demoApps) {
    const name = a.college?.name ?? '?';
    perSchool[name] ??= {};
    perSchool[name][a.status] = (perSchool[name][a.status] ?? 0) + 1;
  }
  console.log('demo applications by school:');
  for (const [name, counts] of Object.entries(perSchool)) console.log(`  - ${name}:`, counts);

  const { data: checks } = await db
    .from('document_ai_checks')
    .select('status, verdict, error, application:applications!inner(student:students!inner(profile:profiles!inner(email)))')
    .like('application.student.profile.email', 'demo.%@example.com');
  const tally = {};
  for (const c of checks ?? []) {
    const key = c.status === 'done' ? `done:${c.verdict}` : c.status;
    tally[key] = (tally[key] ?? 0) + 1;
  }
  console.log('AI document checks on demo files:', tally);
  const errors = [...new Set((checks ?? []).map((c) => c.error).filter(Boolean))];
  if (errors.length) console.log('  check errors seen:', errors.slice(0, 3));
}

// The earlier migrations must be live.
const checks = [
  ['colleges.theme', db.from('colleges').select('theme').limit(1)],
  ['applications.assigned_to', db.from('applications').select('assigned_to').limit(1)],
  ['review_queue_items view', db.from('review_queue_items').select('id').limit(1)],
  ['message_templates table', db.from('message_templates').select('id').limit(1)],
];
for (const [label, query] of checks) {
  const { error: e } = await query;
  console.log(`${label}: ${e ? `MISSING (${e.message})` : 'ok'}`);
}
