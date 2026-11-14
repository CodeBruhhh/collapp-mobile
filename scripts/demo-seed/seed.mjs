// Fills the database with demo data: Cebu City schools (pages, logos, programs,
// requirements, posts, page colors, message templates), their representatives,
// and students with applications, documents, scores, messages and notifications.
//
// Run from the project root (needs the service-role key in .env.seed):
//   node --env-file=.env.local --env-file=.env.seed scripts/demo-seed/seed.mjs
// Undo with cleanup.mjs. Refuses to run twice (demo accounts already present).
import { randomUUID } from 'node:crypto';

import * as upngModule from '@pdf-lib/upng';
import { createClient } from '@supabase/supabase-js';

import { applicantScore } from '../../supabase/functions/_shared/scoring.ts';
import { brandFromSwatches, logoSwatches } from '../../src/features/theme/palette.ts';
import { schoolAssets } from './assets.mjs';
import {
  ADMIN_THREAD,
  APPLICATIONS,
  COMMENTS,
  DEMO_PASSWORD,
  ESSAYS,
  requirementsFor,
  RESUBMIT_NOTES,
  SCHOOLS,
  STUDENTS,
  THREADS,
} from './data.mjs';
import { DOCUMENT_BUILDERS } from './documents.mjs';

export const SEED_SOURCE = 'demo-seed';
const REGION = 'Region VII (Central Visayas)';
/** Gap between document uploads: each one starts an AI check (Gemini rate limits). */
const DOCUMENT_GAP_MS = 3500;

const pickUpng = (m) => (m && typeof m.decode === 'function' ? m : null);
const UPNG = pickUpng(upngModule) ?? pickUpng(upngModule.default) ?? pickUpng(upngModule.default?.default);

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL (.env.local) or SUPABASE_SERVICE_ROLE_KEY (.env.seed).');
  process.exit(1);
}
const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NOW = Date.now();
const ago = (days, hours = 0) => new Date(NOW - days * 86_400_000 - hours * 3_600_000).toISOString();
const log = (...args) => console.log(...args);

async function q(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function upload(bucket, path, bytes, contentType) {
  const { error } = await db.storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
  if (error) throw new Error(`upload ${bucket}/${path}: ${error.message}`);
}

async function createUser(email, fullName) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`create ${email}: ${error.message}`);
  return data.user.id;
}

const fill = (body, values) =>
  body.replace(/\{(first_name|full_name|program|college|document)\}/g, (t, k) => values[k] ?? t);

const DECLINE =
  'Thank you for applying to {college}, {first_name}. After careful review, we are unable to offer you admission at this time. We wish you every success in your studies.';

const STATUS_TITLES = {
  under_review: 'Application under review',
  accepted: 'You’ve been accepted!',
  rejected: 'Application decision available',
  action_required: 'Action required on your application',
};

// --- Preflight -------------------------------------------------------------------

async function preflight() {
  for (const [label, query] of [
    ['colleges.theme', db.from('colleges').select('theme').limit(1)],
    ['applications.assigned_to', db.from('applications').select('assigned_to').limit(1)],
    ['message_templates', db.from('message_templates').select('id').limit(1)],
  ]) {
    const { error } = await query;
    if (error) throw new Error(`Migration missing (${label}): ${error.message}`);
  }
  const existing = await q(
    db.from('profiles').select('email').like('email', 'demo.%@example.com').limit(1),
    'check demo accounts',
  );
  if (existing.length) throw new Error('Demo accounts already exist. Run cleanup.mjs first.');
  const names = SCHOOLS.map((s) => s.name);
  const clash = await q(db.from('colleges').select('name').in('name', names), 'check college names');
  if (clash.length) throw new Error(`Colleges already exist: ${clash.map((c) => c.name).join(', ')}`);
  const admins = await q(
    db.from('profiles').select('id').eq('role', 'admin').eq('status', 'active').limit(1),
    'find admin',
  );
  return admins[0]?.id ?? null;
}

// --- Schools -------------------------------------------------------------------------

function themeFrom(logo, swap) {
  if (!logo || logo.mime !== 'image/png') return null;
  const png = UPNG.decode(logo.bytes.buffer.slice(logo.bytes.byteOffset, logo.bytes.byteOffset + logo.bytes.byteLength));
  const swatches = logoSwatches(new Uint8Array(UPNG.toRGBA8(png)[0]), png.width, png.height);
  if (!swatches.length) return null;
  const brand = brandFromSwatches(swatches, { primary: '#174F4B', secondary: '#2F5D7C', accent: '#8A5E0E' });
  return {
    ...(swap ? { ...brand, primary: brand.secondary, secondary: brand.primary } : brand),
    source: swap ? 'custom' : 'logo',
    palette: swatches.map((s) => s.hex),
  };
}

async function seedSchool(school, index) {
  log(`\n[${school.key}] ${school.name}`);
  const assets = await schoolAssets(school.assets);
  const collegeId = randomUUID();
  const logoPath = assets.logo ? `${collegeId}/logo-${randomUUID()}.${assets.logo.ext}` : null;
  if (assets.logo) await upload('college-media', logoPath, assets.logo.bytes, assets.logo.mime);

  await q(
    db.from('colleges').insert({
      id: collegeId,
      name: school.name,
      description: school.description,
      website: school.website,
      region: REGION,
      province: 'Cebu',
      city: 'Cebu City',
      logo_path: logoPath,
      profile_status: 'published',
      theme: themeFrom(assets.logo, school.swapBrand),
    }),
    'insert college',
  );
  // cleanup.mjs finds the colleges this script made through these entries.
  await q(
    db.from('audit_logs').insert({
      action: 'college.created',
      entity: 'college',
      entity_id: collegeId,
      meta: { source: SEED_SOURCE, name: school.name },
    }),
    'audit college',
  );
  log(`  college + logo${assets.photo ? ` (photo: ${assets.photoTitle})` : ''}`);

  const programIds = {};
  await q(
    db.from('programs').insert(
      school.programs.map((p) => {
        programIds[p.key] = randomUUID();
        return {
          id: programIds[p.key],
          college_id: collegeId,
          name: p.name,
          description: p.description,
          degree: p.degree,
          deadline: p.deadline,
          slots: p.slots,
          min_gpa: p.min_gpa,
          strands: p.strands,
          essay_prompt: p.essay_prompt ?? null,
          prerequisites: p.prerequisites ?? null,
          is_open: !p.closed,
        };
      }),
    ),
    'insert programs',
  );

  const requirementIds = {};
  const requirements = requirementsFor(school);
  await q(
    db.from('requirements').insert(
      requirements.map((r, i) => {
        requirementIds[r.key] = randomUUID();
        return {
          id: requirementIds[r.key],
          college_id: collegeId,
          program_id: r.program ? programIds[r.program] : null,
          label: r.label,
          description: r.description,
          kind: r.kind,
          is_required: !r.optional,
          sort_order: i,
        };
      }),
    ),
    'insert requirements',
  );
  log(`  ${school.programs.length} programs, ${requirements.length} requirements`);

  const repIds = {};
  for (const rep of school.reps) {
    repIds[rep.key] = await createUser(rep.email, rep.name);
    await q(
      db.from('profiles').update({ role: 'school_rep', college_id: collegeId, full_name: rep.name }).eq('id', repIds[rep.key]),
      'promote rep',
    );
  }
  const firstRep = repIds[school.reps[0].key];
  log(`  reps: ${school.reps.map((r) => r.email).join(', ')}`);

  let mediaPath = null;
  if (assets.photo) {
    mediaPath = `${collegeId}/posts/${randomUUID()}.${assets.photo.ext}`;
    await upload('college-media', mediaPath, assets.photo.bytes, assets.photo.mime);
  }
  const published = ago(index + 1, 3);
  const postId = randomUUID();
  await q(
    db.from('posts').insert({
      id: postId,
      college_id: collegeId,
      author_id: firstRep,
      type: school.post.type,
      title: school.post.title,
      body: school.post.body,
      media_path: mediaPath,
      event_at: school.post.event_at ?? null,
      status: 'published',
      published_at: published,
      created_at: published,
    }),
    'insert post',
  );

  const templates = [school.template, school.resubmitTemplate].filter(Boolean);
  if (templates.length) {
    await q(
      db.from('message_templates').insert(
        templates.map((t) => ({ college_id: collegeId, created_by: firstRep, kind: t.kind, title: t.title, body: t.body })),
      ),
      'insert templates',
    );
  }
  log(`  post${mediaPath ? ' with photo' : ''}, ${templates.length} template(s)`);

  return { ...school, collegeId, programIds, requirementIds, requirements, repIds, postId };
}

// --- Students ------------------------------------------------------------------------

async function seedStudent(s) {
  const id = await createUser(s.email, `${s.first} ${s.last}`);
  await q(
    db.from('students').insert({
      user_id: id,
      first_name: s.first,
      last_name: s.last,
      date_of_birth: s.dob,
      sex: s.sex,
      address: s.city,
      senior_high_school: s.highSchool,
      strand: s.strand,
      gpa: s.gpa,
      target_majors: s.majors,
      preferred_locations: [REGION],
      interests: s.interests,
      career_goals: s.goals,
      profile_complete: true,
    }),
    `insert student ${s.email}`,
  );
  return { ...s, id };
}

// --- Applications ----------------------------------------------------------------------

/** Review status per required document for an application's document plan. */
function reviewPlan(plan, keys) {
  return keys.map((key, i) => {
    if (plan === 'approved') return 'approved';
    if (plan === 'pending') return 'pending';
    if (plan === 'resubmit') return i === 0 ? 'resubmit' : 'approved';
    return i === keys.length - 1 ? 'pending' : 'approved'; // mixed
  });
}

async function seedApplication(a, schools, students, notifications) {
  const school = schools[a.school];
  const student = students[a.student];
  const program = school.programs.find((p) => p.key === a.program);
  const programId = school.programIds[a.program];
  const id = randomUUID();
  const draft = a.status === 'draft';
  const submittedAt = draft ? null : ago(a.days, 2);
  const decided = a.status === 'accepted' || a.status === 'rejected';
  const decidedAt = decided ? ago(a.decidedDays ?? 1, 1) : null;
  const assignee = a.assignee ? school.repIds[a.assignee] : null;
  const reviewer = assignee ?? Object.values(school.repIds)[0];
  const values = {
    first_name: student.first,
    full_name: `${student.first} ${student.last}`,
    program: program.name,
    college: school.name,
  };

  await q(
    db.from('applications').insert({
      id,
      student_id: student.id,
      college_id: school.collegeId,
      program_id: programId,
      second_program_id: a.second ? school.programIds[a.second] : null,
      status: a.status,
      essay: school.essay ? (ESSAYS[a.student] ?? null) : null,
      submitted_at: submittedAt,
      decided_at: decidedAt,
      decision_message: decided
        ? fill(a.status === 'accepted' ? school.template.body : DECLINE, values)
        : null,
      final_program_id: a.status === 'accepted' ? programId : null,
      assigned_to: assignee,
      created_at: ago((a.days ?? 1) + 1),
    }),
    `insert application ${a.student}/${a.school}`,
  );

  // Required documents for this program, uploaded and reviewed per the plan.
  const required = school.requirements.filter(
    (r) => r.kind === 'document' && !r.optional && (!r.program || r.program === a.program),
  );
  const statuses = draft ? [] : reviewPlan(a.docs, required.map((r) => r.key));
  for (const [i, r] of required.entries()) {
    if (draft) break;
    const build = DOCUMENT_BUILDERS[r.key.startsWith('medical') ? 'medical' : r.key];
    const path = `${student.id}/${randomUUID()}.pdf`;
    const bytes = await build(student);
    await upload('documents', path, bytes, 'application/pdf');
    const status = statuses[i];
    const reviewed = status !== 'pending';
    await q(
      db.from('documents').insert({
        owner_id: student.id,
        application_id: id,
        requirement_id: school.requirementIds[r.key],
        label: r.label,
        storage_path: path,
        mime_type: 'application/pdf',
        size_bytes: bytes.length,
        review_status: status,
        review_notes: status === 'resubmit' ? (RESUBMIT_NOTES[r.key] ?? RESUBMIT_NOTES.form138) : null,
        reviewed_by: reviewed ? reviewer : null,
        reviewed_at: reviewed ? ago(Math.max(0, a.days - 2)) : null,
        created_at: submittedAt,
      }),
      'insert document',
    );
    await sleep(DOCUMENT_GAP_MS);
  }

  // Fit score from the same rules the ai-score function uses.
  if (!draft) {
    const others = APPLICATIONS.filter(
      (o) => o !== a && o.student === a.student && !['draft', 'rejected'].includes(o.status),
    ).length;
    const result = applicantScore(
      {
        strand: student.strand,
        gpa: student.gpa,
        target_majors: student.majors,
        preferred_locations: [REGION],
        interests: student.interests,
        region: REGION,
      },
      {
        id: programId,
        name: program.name,
        description: program.description,
        strands: program.strands,
        min_gpa: program.min_gpa,
        deadline: program.deadline,
        is_open: !program.closed,
      },
      { id: school.collegeId, name: school.name, region: REGION },
      {
        essay: school.essay ? (ESSAYS[a.student] ?? null) : null,
        essayRequired: school.essay,
        requiredDocuments: required.length,
        submittedDocuments: statuses.filter((st) => st === 'approved' || st === 'pending').length,
        approvedDocuments: statuses.filter((st) => st === 'approved').length,
        followsCollege: true,
        otherActiveApplications: others,
      },
    );
    await q(
      db.from('ai_scores').insert({
        application_id: id,
        fit_score: result.fit,
        enrollment_likelihood: result.likelihood,
        breakdown: { ...result.breakdown, reasons: result.reasons },
        explanation: result.reasons.join(' · ') || null,
      }),
      'insert score',
    );
  }

  if (a.held) {
    await q(
      db.from('staged_decisions').insert({
        application_id: id,
        college_id: school.collegeId,
        decision: a.held,
        final_program_id: a.held === 'accepted' ? programId : null,
        decision_message: fill(a.held === 'accepted' ? school.template.body : DECLINE, values),
        staged_by: reviewer,
        staged_at: ago(1, 5),
      }),
      'hold decision',
    );
  }

  // The notifications the app's own triggers would have sent.
  if (!draft) {
    for (const repId of Object.values(school.repIds)) {
      notifications.push({
        user_id: repId,
        type: 'new_application',
        title: 'New application',
        body: `A student applied to ${school.name}`,
        data: { application_id: id },
        created_at: submittedAt,
        read_at: a.days > 3 ? ago(a.days - 1) : null,
      });
    }
  }
  if (STATUS_TITLES[a.status]) {
    const at = decidedAt ?? ago(Math.max(0, a.days - 2));
    notifications.push({
      user_id: student.id,
      type: 'application_status',
      title: STATUS_TITLES[a.status],
      body: school.name,
      data: { application_id: id, status: a.status },
      created_at: at,
      read_at: decided && (a.decidedDays ?? 0) > 3 ? ago(1) : null,
    });
  }
  log(`  ${student.first} ${student.last} -> ${school.key} ${program.name} [${a.status}] ${required.length && !draft ? `${required.length} docs` : ''}`);
  return id;
}

// --- Conversations and feed ---------------------------------------------------------------

async function seedThreads(schools, students, adminId) {
  for (const t of THREADS) {
    const school = schools[t.school];
    const student = students[t.student];
    const threadId = randomUUID();
    await q(
      db.from('threads').insert({ id: threadId, kind: 'student_rep', college_id: school.collegeId, student_id: student.id }),
      'insert thread',
    );
    for (const [i, m] of t.messages.entries()) {
      const last = i === t.messages.length - 1;
      await q(
        db.from('messages').insert({
          thread_id: threadId,
          sender_id: m.from === 'student' ? student.id : school.repIds[m.rep],
          body: m.text,
          created_at: ago(0, m.hoursAgo),
          // The latest message is still unread by its recipient.
          read_at: last ? null : ago(0, m.hoursAgo - 1),
        }),
        'insert message',
      );
    }
    await q(
      db.from('threads').update({ last_message_at: ago(0, t.messages.at(-1).hoursAgo) }).eq('id', threadId),
      'thread time',
    );
  }
  log(`  ${THREADS.length} student conversations`);

  if (!adminId) {
    log('  (no active admin found; skipped the rep-to-admin conversation)');
    return;
  }
  const school = schools[ADMIN_THREAD.school];
  const threadId = randomUUID();
  await q(
    db.from('threads').insert({
      id: threadId,
      kind: 'rep_admin',
      college_id: school.collegeId,
      admin_id: adminId,
      subject: ADMIN_THREAD.subject,
    }),
    'insert admin thread',
  );
  for (const m of ADMIN_THREAD.messages) {
    await q(
      db.from('messages').insert({
        thread_id: threadId,
        sender_id: school.repIds[ADMIN_THREAD.rep],
        body: m.text,
        created_at: ago(0, m.hoursAgo),
      }),
      'insert admin message',
    );
  }
  await q(
    db.from('threads').update({ last_message_at: ago(0, ADMIN_THREAD.messages.at(-1).hoursAgo) }).eq('id', threadId),
    'admin thread time',
  );
  log('  1 conversation with the administrator');
}

async function seedFeed(schools, students) {
  const reactions = ['like', 'love', 'like', 'wow', 'care', 'like', 'love'];
  const studentList = Object.values(students);
  const rows = [];
  Object.values(schools).forEach((school, i) => {
    // A different handful of students reacts to each post.
    const count = 4 + (i % 4);
    for (let j = 0; j < count; j++) {
      const student = studentList[(i * 3 + j * 2) % studentList.length];
      if (rows.some((r) => r.post_id === school.postId && r.student_id === student.id)) continue;
      rows.push({ post_id: school.postId, student_id: student.id, reaction: reactions[(i + j) % reactions.length] });
    }
  });
  await q(db.from('post_reactions').insert(rows), 'insert reactions');
  await q(
    db.from('post_comments').insert(
      COMMENTS.map((c, i) => ({
        post_id: schools[c.school].postId,
        author_id: students[c.student].id,
        body: c.text,
        created_at: ago(0, 20 - i * 2),
      })),
    ),
    'insert comments',
  );
  // A few students also follow schools they haven't applied to yet.
  await q(
    db.from('follows').upsert(
      [
        ['s12', 'upc'],
        ['s16', 'usc'],
        ['s11', 'usc'],
        ['s8', 'citu'],
        ['s18', 'upc'],
      ].map(([s, c]) => ({ student_id: students[s].id, college_id: schools[c].collegeId })),
      { onConflict: 'student_id,college_id', ignoreDuplicates: true },
    ),
    'insert follows',
  );
  log(`  ${rows.length} reactions, ${COMMENTS.length} comments, extra follows`);
}

// --- Run -------------------------------------------------------------------------------------

async function main() {
  const adminId = await preflight();
  log('Preflight ok. Seeding schools...');

  const schools = {};
  for (const [i, school] of SCHOOLS.entries()) schools[school.key] = await seedSchool(school, i);

  log('\nStudents...');
  const students = {};
  for (const s of STUDENTS) students[s.key] = await seedStudent(s);
  log(`  ${STUDENTS.length} students`);

  log('\nApplications (documents are uploaded slowly so the AI checks are not rate-limited)...');
  const notifications = [];
  for (const a of APPLICATIONS) await seedApplication(a, schools, students, notifications);

  log('\nConversations and feed...');
  await seedThreads(schools, students, adminId);
  await seedFeed(schools, students);

  await q(db.from('notifications').insert(notifications), 'insert notifications');
  log(`  ${notifications.length} notifications`);

  log('\nDone. Demo accounts (password for all: ' + DEMO_PASSWORD + ')');
  for (const school of SCHOOLS) for (const rep of school.reps) log(`  rep      ${rep.email.padEnd(32)} ${school.name}`);
  for (const s of STUDENTS) log(`  student  ${s.email.padEnd(32)} ${s.first} ${s.last}`);
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message);
  console.error('Run cleanup.mjs to remove anything created before the failure.');
  process.exit(1);
});
