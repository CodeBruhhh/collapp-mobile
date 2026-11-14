// Removes everything seed.mjs created: demo accounts (demo.*@example.com, which
// takes their applications, documents, messages and reactions with them), the
// colleges it created (found through its audit-log entries), and their files.
// Data that existed before the seed is never touched.
//
//   node --env-file=.env.local --env-file=.env.seed scripts/demo-seed/cleanup.mjs
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function q(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

/** Every file under a folder (storage lists one level at a time). */
async function listAll(bucket, folder) {
  const out = [];
  const entries = await q(db.storage.from(bucket).list(folder, { limit: 1000 }), `list ${bucket}/${folder}`);
  for (const e of entries) {
    const path = `${folder}/${e.name}`;
    if (e.id) out.push(path);
    else out.push(...(await listAll(bucket, path)));
  }
  return out;
}

async function removeFolder(bucket, folder) {
  const paths = await listAll(bucket, folder);
  for (let i = 0; i < paths.length; i += 100) {
    await q(db.storage.from(bucket).remove(paths.slice(i, i + 100)), `remove ${bucket}/${folder}`);
  }
  return paths.length;
}

const accounts = await q(
  db.from('profiles').select('id, email, role').like('email', 'demo.%@example.com'),
  'find demo accounts',
);
const audits = await q(
  db.from('audit_logs').select('entity_id').eq('action', 'college.created').eq('meta->>source', 'demo-seed'),
  'find demo colleges',
);
const collegeIds = [...new Set(audits.map((a) => a.entity_id))];
console.log(`Found ${accounts.length} demo accounts and ${collegeIds.length} demo colleges.`);

let files = 0;
for (const a of accounts.filter((x) => x.role === 'student')) {
  files += await removeFolder('documents', a.id);
  files += await removeFolder('attachments', a.id);
}
for (const id of collegeIds) files += await removeFolder('college-media', id);
console.log(`Removed ${files} files.`);

// Accounts first: a rep's profile keeps its college from being deleted.
for (const a of accounts) {
  const { error } = await db.auth.admin.deleteUser(a.id);
  if (error) throw new Error(`delete ${a.email}: ${error.message}`);
}
console.log(`Deleted ${accounts.length} accounts.`);

if (collegeIds.length) {
  await q(db.from('colleges').delete().in('id', collegeIds), 'delete colleges');
}
console.log(`Deleted ${collegeIds.length} colleges (with their programs, requirements, posts and templates).`);
