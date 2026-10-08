import * as Crypto from 'expo-crypto';

import { supabase } from '@/lib/supabase';
import { objectPath, removeFile, signedUrl, uploadFile, type LocalFile } from '@/lib/storage';
import type { Tables } from '@/types/database';

/** One row of the inbox (public.my_threads). */
export type ThreadSummary = {
  id: string;
  kind: Tables<'threads'>['kind'];
  college_id: string;
  college_name: string;
  college_logo_path: string | null;
  student_id: string | null;
  student_name: string | null;
  subject: string | null;
  last_message_at: string;
  last_message: string | null;
  last_sender_id: string | null;
  unread_count: number;
};

export type Message = Pick<
  Tables<'messages'>,
  | 'id'
  | 'thread_id'
  | 'sender_id'
  | 'body'
  | 'attachment_path'
  | 'attachment_name'
  | 'attachment_mime'
  | 'scan_status'
  | 'read_at'
  | 'created_at'
>;

const MESSAGE_SELECT =
  'id, thread_id, sender_id, body, attachment_path, attachment_name, attachment_mime, scan_status, read_at, created_at';
const PAGE_SIZE = 200;

export async function listThreads(): Promise<ThreadSummary[]> {
  const { data, error } = await supabase.rpc('my_threads');
  if (error) throw error;
  // Generated RPC types mark every column non-null; the inbox row is the real shape.
  return data as ThreadSummary[];
}

export async function getThread(threadId: string) {
  const { data, error } = await supabase
    .from('threads')
    .select(
      `id, kind, college_id, student_id, admin_id, subject,
       college:colleges(id, name, logo_path),
       student:students(first_name, last_name)`,
    )
    .eq('id', threadId)
    .single();
  if (error) throw error;
  return data;
}
export type ThreadDetail = Awaited<ReturnType<typeof getThread>>;

/** The latest messages, oldest first. */
export async function listMessages(threadId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return data.reverse();
}

export type SendMessageInput = {
  /** Client-generated so the optimistic bubble and the saved row share an id. */
  id: string;
  threadId: string;
  body: string;
  attachment?: LocalFile | null;
};

export function newMessageId() {
  return Crypto.randomUUID();
}

/** Upload the attachment (if any) into the thread's folder, then insert the message. */
export async function sendMessage({ id, threadId, body, attachment }: SendMessageInput) {
  let path: string | null = null;
  if (attachment) {
    path = await uploadFile('attachments', objectPath(threadId, attachment.mimeType), attachment);
  }
  const { data, error } = await supabase
    .from('messages')
    .insert({
      id,
      thread_id: threadId,
      body: body.trim(),
      attachment_path: path,
      attachment_name: attachment?.name ?? null,
      attachment_mime: attachment?.mimeType ?? null,
      // The database forces 'pending' for attachments; scan-attachment decides.
      scan_status: attachment ? 'pending' : null,
    })
    .select(MESSAGE_SELECT)
    .single();
  if (error) {
    if (path) await removeFile('attachments', path).catch(() => {});
    // A retry after a lost response: the first attempt already saved it.
    if (error.code === '23505') {
      const existing = await supabase.from('messages').select(MESSAGE_SELECT).eq('id', id).single();
      if (existing.data) return existing.data;
    }
    throw error;
  }
  return data;
}

/** Mark everything the other side sent in this thread as read. */
export async function markThreadRead(threadId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('thread_id', threadId)
    .neq('sender_id', userId)
    .is('read_at', null);
  if (error) throw error;
}

/**
 * Open (or reuse) a thread. The server only allows SRS 3.6.5 pairs:
 * student -> college, rep -> applicant, rep -> admin, admin -> college.
 */
export async function startThread(target: { collegeId?: string; studentId?: string }) {
  const { data, error } = await supabase.rpc('start_thread', {
    p_college_id: target.collegeId,
    p_student_id: target.studentId,
  });
  if (error) throw error;
  return data;
}

/** Colleges an administrator can open a channel with. */
export async function listCollegesForAdmin() {
  const { data, error } = await supabase.from('colleges').select('id, name').order('name');
  if (error) throw error;
  return data;
}

export function attachmentUrl(path: string) {
  return signedUrl('attachments', path, 600);
}
