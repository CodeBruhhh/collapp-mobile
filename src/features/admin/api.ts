import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

// ---------------------------------------------------------------- dashboard

export type AdminStats = {
  users: { student: number; school_rep: number; admin: number; suspended: number };
  colleges: { published: number; draft: number };
  applications: Partial<Record<Enums<'application_status'>, number>>;
  messages_last_7_days: number;
  blocked_attachments: number;
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

export async function setUserStatus(userId: string, status: Enums<'account_status'>) {
  const { error } = await supabase.from('profiles').update({ status }).eq('id', userId);
  if (error) throw error;
}

export type AdminCollege = Pick<
  Tables<'colleges'>,
  'id' | 'name' | 'city' | 'province' | 'region' | 'logo_path' | 'profile_status' | 'created_at'
>;

export async function listAllColleges(): Promise<AdminCollege[]> {
  const { data, error } = await supabase
    .from('colleges')
    .select('id, name, city, province, region, logo_path, profile_status, created_at')
    .order('name');
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
