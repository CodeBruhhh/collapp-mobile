import { File } from 'expo-file-system';
import { getNetworkStateAsync } from 'expo-network';

import { removeFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/validation';

import type { LocalDraft } from './db';
import {
  listLocalDrafts,
  listPendingFiles,
  removeLocalDraft,
  removePendingFile,
  setDraftState,
  setFileError,
} from './outbox';

export type SyncResult = { synced: number; remaining: number; conflicts: number };

let running: Promise<SyncResult> | null = null;

/** Push this device's outbox to Supabase. Concurrent calls share one run. */
export function syncNow(userId: string): Promise<SyncResult> {
  running ??= run(userId).finally(() => {
    running = null;
  });
  return running;
}

async function isOnline(): Promise<boolean> {
  const state = await getNetworkStateAsync();
  return state.isConnected !== false && state.isInternetReachable !== false;
}

const isNewer = (server: string, base: string) => Date.parse(server) > Date.parse(base);

/** Returns true when the draft no longer needs to stay in the outbox. */
async function syncDraft(userId: string, d: LocalDraft): Promise<boolean> {
  const { data: server, error } = await supabase
    .from('applications')
    .select('id, status, updated_at, documents(storage_path)')
    .eq('id', d.id)
    .maybeSingle();
  if (error) throw error;

  if (d.deleted) {
    if (server?.status === 'draft') {
      const { error: delError } = await supabase.from('applications').delete().eq('id', d.id);
      if (delError) throw delError;
      await Promise.all(server.documents.map((doc) => removeFile('documents', doc.storage_path)));
    }
    return true;
  }

  if (!server) {
    // It existed before but is gone now (deleted on another device): drop the local copy.
    if (d.base_updated_at) return true;
    const { error: insertError } = await supabase.from('applications').insert({
      id: d.id,
      student_id: userId,
      college_id: d.college_id,
      program_id: d.program_id,
      second_program_id: d.second_program_id,
      essay: d.essay,
    });
    if (insertError) throw insertError;
    return true;
  }

  // Submitted elsewhere in the meantime: drafts can no longer be edited.
  if (server.status !== 'draft') return true;

  // Changed on the server since this device last saw it: let the student choose (SPMP R5).
  if (d.base_updated_at && isNewer(server.updated_at, d.base_updated_at)) {
    const { data: full } = await supabase.from('applications').select('*').eq('id', d.id).single();
    await setDraftState(d.id, { conflict_json: JSON.stringify(full ?? server) });
    return false;
  }

  const { error: updateError } = await supabase
    .from('applications')
    .update({
      program_id: d.program_id,
      second_program_id: d.second_program_id,
      essay: d.essay,
    })
    .eq('id', d.id);
  if (updateError) throw updateError;
  return true;
}

async function run(userId: string): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, remaining: 0, conflicts: 0 };
  if (!(await isOnline())) {
    const [drafts, files] = await Promise.all([listLocalDrafts(userId), listPendingFiles(userId)]);
    result.remaining = drafts.length + files.length;
    return result;
  }

  // 1. Drafts first, so queued documents have an application to attach to.
  const drafts = await listLocalDrafts(userId);
  const blocked = new Set<string>();
  for (const d of drafts) {
    if (d.conflict_json) {
      result.conflicts++;
      blocked.add(d.id);
      continue;
    }
    try {
      if (await syncDraft(userId, d)) {
        await removeLocalDraft(d.id);
        result.synced++;
      } else {
        result.conflicts++;
        blocked.add(d.id);
      }
    } catch (e) {
      await setDraftState(d.id, { sync_error: getErrorMessage(e) });
      blocked.add(d.id);
      result.remaining++;
    }
  }

  // 2. Files. Paths and row ids come from the queue id, so retries never duplicate.
  for (const f of await listPendingFiles(userId)) {
    if (blocked.has(f.application_id)) {
      result.remaining++;
      continue;
    }
    try {
      const ext = f.mime_type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${userId}/${f.id}.${ext}`;
      const body = await new File(f.uri).arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, body, { contentType: f.mime_type });
      if (uploadError && !/exists|duplicate/i.test(uploadError.message)) throw uploadError;

      const fields = { storage_path: path, mime_type: f.mime_type, size_bytes: f.size_bytes };
      const { error: rowError } = f.replaces_document_id
        ? await supabase.from('documents').update(fields).eq('id', f.replaces_document_id)
        : await supabase.from('documents').insert({
            ...fields,
            id: f.id,
            application_id: f.application_id,
            requirement_id: f.requirement_id,
            label: f.label,
          });
      if (rowError && rowError.code !== '23505') throw rowError;

      if (f.replaces_storage_path) await removeFile('documents', f.replaces_storage_path);
      await removePendingFile(f);
      result.synced++;
    } catch (e) {
      await setFileError(f.id, getErrorMessage(e));
      result.remaining++;
    }
  }

  return result;
}

/** Conflict choice "keep mine": rebase onto the server version, then overwrite it. */
export async function keepLocalVersion(id: string) {
  const { data, error } = await supabase
    .from('applications')
    .select('updated_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  await setDraftState(id, { conflict_json: null, base_updated_at: data.updated_at });
}

/** Conflict choice "use saved version": discard this device's edits. */
export async function keepServerVersion(id: string) {
  await removeLocalDraft(id);
}
