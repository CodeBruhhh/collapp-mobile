import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { ReportReason } from '@/features/feed/reports';
import type { Enums, Tables } from '@/types/database';

export type { ReportReason };

// ---------------------------------------------------------------- dashboard

export type AdminStats = {
  users: { student: number; school_rep: number; admin: number; suspended: number };
  colleges: { published: number; draft: number; suspended?: number };
  applications: Partial<Record<Enums<'application_status'>, number>>;
  messages_last_7_days: number;
  blocked_attachments: number;
  /** Reported posts and comments awaiting review (one per item, not per report). */
  open_reports?: number;
  ai_uses_today?: number;
  weekly_submissions: { week: string; count: number }[];
};

export async function fetchAdminStats(): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_stats');
  if (error) throw error;
  return data as unknown as AdminStats;
}

export type PlatformSettings = Pick<
  Tables<'platform_settings'>,
  'applications_open' | 'maintenance_mode' | 'featured_college_ids'
>;

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('applications_open, maintenance_mode, featured_college_ids')
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------- AI monitor

/** Quota kinds counted by consume_ai_quota in the AI Edge Functions. */
export type AiKind = 'document_check_auto' | 'document_check' | 'essay_feedback' | 'essay_summary';
/** Limited roles and the kinds each uses; administrators are never limited. */
export type LimitedRole = 'student' | 'school_rep';
export const ROLE_AI_KINDS: Record<LimitedRole, AiKind[]> = {
  student: ['document_check_auto', 'document_check', 'essay_feedback'],
  school_rep: ['document_check', 'essay_summary'],
};
/** platform_settings.ai_limits: daily uses per person, per role and kind. */
export type AiLimits = Record<LimitedRole, Partial<Record<AiKind, number>>>;

export type AiOverview = {
  settings: {
    enabled: boolean;
    limits: Partial<AiLimits>;
    defaults: AiLimits;
    resets_at: string;
  };
  today: Partial<Record<AiKind, number>>;
  daily: { day: string; count: number }[];
  documents: {
    by_status: Partial<Record<Enums<'ai_job_status'>, number>>;
    by_verdict: Partial<Record<'pass' | 'review' | 'fail', number>>;
  };
  essays: Partial<Record<Enums<'ai_job_status'>, number>>;
  models: Record<string, number>;
  queue: { waiting: number; gave_up: number };
  recent_errors: {
    kind: 'document' | 'essay';
    status: string;
    error: string;
    occurred_at: string;
  }[];
  top_users: {
    id: string;
    full_name: string;
    email: string;
    role: Enums<'user_role'>;
    kind: AiKind;
    count: number;
  }[];
};

export async function fetchAiOverview(): Promise<AiOverview> {
  const { data, error } = await supabase.rpc('admin_ai_overview');
  if (error) throw error;
  return data as unknown as AiOverview;
}

export async function updateAiSettings(changes: { ai_enabled?: boolean; ai_limits?: AiLimits }) {
  const { error } = await supabase.from('platform_settings').update(changes).eq('id', true);
  if (error) throw error;
}

/** Re-runs recent failed or skipped AI jobs; returns how many were queued. */
export async function retryAiJobs(): Promise<number> {
  const { data, error } = await supabase.rpc('admin_retry_ai_jobs');
  if (error) throw error;
  return data;
}

export async function updatePlatformSettings(changes: Partial<PlatformSettings>) {
  // Single-row table: the primary key is always `true`.
  const { error } = await supabase.from('platform_settings').update(changes).eq('id', true);
  if (error) throw error;
}

// ---------------------------------------------------------------- accounts

export type AdminUser = Pick<
  Tables<'profiles'>,
  'id' | 'full_name' | 'email' | 'role' | 'status' | 'college_id' | 'created_at'
> & { college: { name: string } | null };

const USER_PAGE = 200;

export async function listUsers(search: string): Promise<AdminUser[]> {
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, status, college_id, created_at, college:colleges(name)')
    .order('created_at', { ascending: false })
    .limit(USER_PAGE);
  const term = search.trim().replace(/[%,()]/g, '');
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getUser(userId: string): Promise<AdminUser> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status, college_id, created_at, college:colleges(name)')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function setUserStatus(userId: string, status: Enums<'account_status'>) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
  if (error) throw error;
}

/** Change a role, or move a representative to another college (collegeId only for reps). */
export async function setUserRole(
  userId: string,
  role: Enums<'user_role'>,
  collegeId: string | null,
) {
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user: userId,
    p_role: role,
    p_college: role === 'school_rep' ? collegeId : null,
  });
  if (error) throw error;
}

export type AdminCollege = Pick<
  Tables<'colleges'>,
  | 'id'
  | 'name'
  | 'city'
  | 'province'
  | 'region'
  | 'logo_path'
  | 'profile_status'
  | 'suspended_at'
  | 'created_at'
>;

export async function listAllColleges(): Promise<AdminCollege[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('id, name, city, province, region, logo_path, profile_status, suspended_at, created_at')
    .order('name');
  if (error) throw error;
  return data;
}

/** Suspend (hide the college, suspend its reps) or reinstate; returns the reps affected. */
export async function setCollegeSuspended(collegeId: string, suspended: boolean): Promise<number> {
  const { data, error } = await supabase.rpc('admin_set_college_suspended', {
    p_college: collegeId,
    p_suspended: suspended,
  });
  if (error) throw error;
  return data;
}

export async function setCollegeStatus(collegeId: string, status: Enums<'publish_status'>) {
  const { error } = await supabase
    .from('colleges')
    .update({ profile_status: status })
    .eq('id', collegeId);
  if (error) throw error;
}

export type CreateCollegeInput = {
  college: {
    name: string;
    description?: string;
    website?: string;
    region?: string;
    province?: string;
    city?: string;
  };
  rep: { fullName: string; email: string; password: string };
};

/** Creates the college and its first representative (Edge Function, service role). */
export async function createCollege(input: CreateCollegeInput) {
  const { data, error } = await supabase.functions.invoke<{ college: { id: string } }>(
    'admin-create-college',
    { body: input },
  );
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw error;
  }
  return data!;
}

/** Adds another representative to an existing college (Edge Function, service role). */
export async function createRep(input: {
  collegeId: string;
  rep: { fullName: string; email: string; password: string };
}) {
  const { data, error } = await supabase.functions.invoke<{ repId: string }>('admin-create-rep', {
    body: input,
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw error;
  }
  return data!;
}

/** Creates another administrator account (Edge Function, service role). */
export async function createAdmin(input: { fullName: string; email: string; password: string }) {
  const { data, error } = await supabase.functions.invoke<{ adminId: string }>(
    'admin-create-admin',
    { body: input },
  );
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      throw new Error(payload?.error ?? error.message);
    }
    throw error;
  }
  return data!;
}

// ---------------------------------------------------------------- compliance

export type AuditEntry = Pick<
  Tables<'audit_logs'>,
  'id' | 'action' | 'entity' | 'entity_id' | 'meta' | 'created_at'
> & { actor: { full_name: string; email: string } | null };

const AUDIT_PAGE = 100;

export async function listAuditLogs(actionPrefix: string | null): Promise<AuditEntry[]> {
  let query = supabase
    .from('audit_logs')
    .select('id, action, entity, entity_id, meta, created_at, actor:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(AUDIT_PAGE);
  if (actionPrefix) query = query.like('action', `${actionPrefix}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function listBlockedAttachments() {
  const { data, error } = await supabase
    .from('messages')
    .select(
      'id, thread_id, attachment_name, attachment_mime, created_at, sender:profiles(full_name, email, role)',
    )
    .eq('scan_status', 'blocked')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}
export type BlockedAttachment = Awaited<ReturnType<typeof listBlockedAttachments>>[number];

export async function fetchRlsOverview() {
  const { data, error } = await supabase.rpc('admin_rls_overview');
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------- moderation

export type ModerationAction =
  'dismiss' | 'remove_comment' | 'suspend_author' | 'take_down_post' | 'restore_post';

/** One reported post or comment, with every report against it rolled up. */
export type ModerationItem = {
  target: 'post' | 'comment';
  post_id: string;
  comment_id: string | null;
  report_count: number;
  reasons: ReportReason[];
  details: string[] | null;
  /** The comment text or post title when it was (last) reported. */
  snapshot: string;
  first_reported_at: string;
  last_reported_at: string;
  resolution: 'dismissed' | 'comment_removed' | 'post_taken_down' | 'author_suspended' | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  post_title: string;
  post_status: Enums<'publish_status'>;
  taken_down_at: string | null;
  takedown_reason: string | null;
  college_name: string;
  comment_exists: boolean;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  author_status: Enums<'account_status'> | null;
};

export async function listModerationQueue(status: 'open' | 'resolved'): Promise<ModerationItem[]> {
  const { data, error } = await supabase.rpc('admin_moderation_queue', { p_status: status });
  if (error) throw error;
  return (data ?? []) as unknown as ModerationItem[];
}

export async function moderate(input: {
  postId: string;
  commentId: string | null;
  action: ModerationAction;
  note?: string;
}): Promise<number> {
  const { data, error } = await supabase.rpc('admin_moderate', {
    p_post: input.postId,
    p_comment: input.commentId,
    p_action: input.action,
    p_note: input.note ?? null,
  });
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------- broadcast

export type Audience = 'all' | 'student' | 'school_rep' | 'admin';

export async function sendBroadcast(title: string, body: string, audience: Audience) {
  const { data, error } = await supabase.rpc('admin_broadcast', {
    p_title: title,
    p_body: body,
    p_audience: audience,
  });
  if (error) throw error;
  return data;
}
