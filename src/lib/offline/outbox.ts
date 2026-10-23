import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import type { LocalFile } from '@/lib/storage';

import { getDb, type LocalDraft, type PendingFile } from './db';

const now = () => new Date().toISOString();

/** Picked/scanned files are copied here so cache cleanup can't delete them before upload. */
function pendingDir(): Directory {
  const dir = new Directory(Paths.document, 'pending-uploads');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

function deleteLocalFile(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone; nothing to clean up.
  }
}

// --- drafts ----------------------------------------------------------------

export async function listLocalDrafts(userId: string): Promise<LocalDraft[]> {
  const db = await getDb();
  return db.getAllAsync<LocalDraft>('SELECT * FROM drafts WHERE user_id = ?', userId);
}

export async function getLocalDraft(id: string): Promise<LocalDraft | null> {
  const db = await getDb();
  return db.getFirstAsync<LocalDraft>('SELECT * FROM drafts WHERE id = ?', id);
}

/** Save draft fields locally. Keeps the first server version seen so conflicts can be detected. */
export async function saveLocalDraft(input: {
  id?: string;
  userId: string;
  collegeId: string;
  programId: string;
  secondProgramId: string | null;
  essay: string | null;
  /** Server `updated_at` of the draft being edited; null for brand-new drafts. */
  baseUpdatedAt: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = input.id ?? Crypto.randomUUID();
  const existing = await getLocalDraft(id);
  await db.runAsync(
    `INSERT INTO drafts (id, user_id, college_id, program_id, second_program_id, essay,
       base_updated_at, local_updated_at, deleted, conflict_json, sync_error)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL)
     ON CONFLICT(id) DO UPDATE SET
       program_id = excluded.program_id,
       second_program_id = excluded.second_program_id,
       essay = excluded.essay,
       local_updated_at = excluded.local_updated_at,
       sync_error = NULL`,
    id,
    input.userId,
    input.collegeId,
    input.programId,
    input.secondProgramId,
    input.essay,
    existing?.base_updated_at ?? input.baseUpdatedAt,
    now(),
  );
  return id;
}

/** Mark a draft for deletion; unsynced drafts are removed straight away. */
export async function deleteLocalDraft(input: {
  id: string;
  userId: string;
  collegeId: string;
  programId: string;
  existsOnServer: boolean;
}) {
  const db = await getDb();
  const files = await db.getAllAsync<PendingFile>(
    'SELECT * FROM pending_files WHERE application_id = ?',
    input.id,
  );
  files.forEach((f) => deleteLocalFile(f.uri));
  await db.runAsync('DELETE FROM pending_files WHERE application_id = ?', input.id);
  if (!input.existsOnServer) {
    await db.runAsync('DELETE FROM drafts WHERE id = ?', input.id);
    return;
  }
  await db.runAsync(
    `INSERT INTO drafts (id, user_id, college_id, program_id, local_updated_at, deleted)
     VALUES (?, ?, ?, ?, ?, 1)
     ON CONFLICT(id) DO UPDATE SET deleted = 1, local_updated_at = excluded.local_updated_at`,
    input.id,
    input.userId,
    input.collegeId,
    input.programId,
    now(),
  );
}

export async function removeLocalDraft(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM drafts WHERE id = ?', id);
}

export async function setDraftState(
  id: string,
  state: { sync_error?: string | null; conflict_json?: string | null; base_updated_at?: string },
) {
  const db = await getDb();
  const sets = Object.keys(state).map((k) => `${k} = ?`);
  if (!sets.length) return;
  await db.runAsync(
    `UPDATE drafts SET ${sets.join(', ')} WHERE id = ?`,
    ...(Object.values(state) as (string | null)[]),
    id,
  );
}

// --- files -------------------------------------------------------------------

export async function listPendingFiles(userId: string): Promise<PendingFile[]> {
  const db = await getDb();
  return db.getAllAsync<PendingFile>(
    'SELECT * FROM pending_files WHERE user_id = ? ORDER BY created_at',
    userId,
  );
}

/** Queue a document for upload. A newer file for the same requirement replaces the older one. */
export async function queueFile(input: {
  userId: string;
  applicationId: string;
  requirementId: string | null;
  label: string;
  file: LocalFile;
  replacesDocument: { id: string; storage_path: string } | null;
}): Promise<void> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const ext = input.file.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
  const target = new File(pendingDir(), `${id}.${ext}`);
  await new File(input.file.uri).copy(target);

  if (input.requirementId) {
    const older = await db.getAllAsync<PendingFile>(
      'SELECT * FROM pending_files WHERE application_id = ? AND requirement_id = ?',
      input.applicationId,
      input.requirementId,
    );
    older.forEach((f) => deleteLocalFile(f.uri));
    await db.runAsync(
      'DELETE FROM pending_files WHERE application_id = ? AND requirement_id = ?',
      input.applicationId,
      input.requirementId,
    );
  }

  await db.runAsync(
    `INSERT INTO pending_files (id, user_id, application_id, requirement_id, label, uri,
       mime_type, size_bytes, replaces_document_id, replaces_storage_path, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.userId,
    input.applicationId,
    input.requirementId,
    input.label,
    target.uri,
    input.file.mimeType,
    input.file.size,
    input.replacesDocument?.id ?? null,
    input.replacesDocument?.storage_path ?? null,
    now(),
  );
}

export async function removePendingFile(file: PendingFile) {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_files WHERE id = ?', file.id);
  deleteLocalFile(file.uri);
}

export async function setFileError(id: string, error: string | null) {
  const db = await getDb();
  await db.runAsync('UPDATE pending_files SET sync_error = ? WHERE id = ?', error, id);
}

/** Erase everything this user left on the device (account deletion). */
export async function clearUserOutbox(userId: string) {
  const files = await listPendingFiles(userId);
  for (const file of files) deleteLocalFile(file.uri);
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_files WHERE user_id = ?', userId);
  await db.runAsync('DELETE FROM drafts WHERE user_id = ?', userId);
}
