import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/AuthContext';
import { useSync } from '@/context/SyncContext';
import type { PendingFile } from '@/lib/offline/db';
import {
  deleteLocalDraft,
  listLocalDrafts,
  listPendingFiles,
  queueFile,
  removePendingFile,
  saveLocalDraft,
} from '@/lib/offline/outbox';
import { keepLocalVersion, keepServerVersion } from '@/lib/offline/sync';
import type { LocalFile } from '@/lib/storage';

import { useColleges } from '@/features/colleges/hooks';

import {
  removeDocument,
  submitApplication,
  type ApplicationDocument,
  type MyApplication,
} from './api';
import { applicationKeys, useApplication, useMyApplications } from './hooks';

/** A document as shown to the student: either on the server or queued on this device. */
export type DisplayDocument = Pick<
  ApplicationDocument,
  'id' | 'requirement_id' | 'label' | 'mime_type' | 'size_bytes' | 'review_status' | 'review_notes'
> & {
  /** True while the file only exists on this device. */
  local: boolean;
  syncError: string | null;
  server: ApplicationDocument | null;
  pending: PendingFile | null;
};

/** Server documents with any queued uploads layered on top (a queued file replaces its target). */
export function mergeDocuments(
  serverDocs: ApplicationDocument[],
  pending: PendingFile[],
): DisplayDocument[] {
  const replaced = new Set(pending.map((p) => p.replaces_document_id).filter(Boolean));
  const fromServer: DisplayDocument[] = serverDocs
    .filter((d) => !replaced.has(d.id))
    .map((d) => ({ ...d, local: false, syncError: null, server: d, pending: null }));
  const fromDevice: DisplayDocument[] = pending.map((p) => ({
    id: p.id,
    requirement_id: p.requirement_id,
    label: p.label,
    mime_type: p.mime_type,
    size_bytes: p.size_bytes,
    review_status: 'pending',
    review_notes: null,
    local: true,
    syncError: p.sync_error,
    server: serverDocs.find((d) => d.id === p.replaces_document_id) ?? null,
    pending: p,
  }));
  return [...fromServer, ...fromDevice];
}

/**
 * Server applications plus drafts that so far exist only on this device, shaped
 * like server rows so lists (tracker, home) can show them before the first sync.
 */
export function useApplicationsWithLocal() {
  const sync = useSync();
  const applications = useMyApplications();
  const colleges = useColleges({});
  const server = applications.data ?? [];
  const serverIds = new Set(server.map((a) => a.id));

  const localOnly: MyApplication[] = sync.localDrafts
    .filter((d) => !d.deleted && !serverIds.has(d.id))
    .flatMap((d): MyApplication[] => {
      const college = colleges.data?.find((c) => c.id === d.college_id);
      const program = college?.programs.find((p) => p.id === d.program_id);
      // Without cached college data there is nothing meaningful to show yet.
      if (!college || !program) return [];
      return [
        {
          id: d.id,
          student_id: d.user_id,
          college_id: d.college_id,
          program_id: d.program_id,
          second_program_id: d.second_program_id,
          status: 'draft',
          essay: d.essay,
          submitted_at: null,
          decided_at: null,
          decision_message: null,
          final_program_id: null,
          created_at: d.local_updated_at,
          updated_at: d.local_updated_at,
          college: {
            id: college.id,
            name: college.name,
            city: college.city,
            province: college.province,
            region: college.region,
            logo_path: college.logo_path,
          },
          program: { id: program.id, name: program.name, deadline: program.deadline },
          documents: [],
        },
      ];
    });

  // Drafts deleted on this device disappear right away, even before the delete syncs.
  const deletedIds = new Set(sync.localDrafts.filter((d) => d.deleted).map((d) => d.id));
  return {
    ...applications,
    data: applications.data
      ? [...localOnly, ...server.filter((a) => !deletedIds.has(a.id))]
      : undefined,
  };
}

/** Queue-backed document actions for one application (works offline). */
export function useDocumentQueue(applicationId: string | null) {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const sync = useSync();
  const queryClient = useQueryClient();
  const pending = sync.pendingFiles.filter((f) => f.application_id === applicationId);

  async function attach(
    requirement: { id: string; label: string },
    file: LocalFile,
    existing: DisplayDocument | undefined,
  ) {
    if (!applicationId) throw new Error('Save the application first.');
    // Replacing a queued file just swaps the queue entry; replacing a server file updates it.
    const target = existing?.server ?? null;
    await queueFile({
      userId,
      applicationId,
      requirementId: requirement.id,
      label: requirement.label,
      file,
      replacesDocument: target ? { id: target.id, storage_path: target.storage_path } : null,
    });
    await sync.refreshOutbox();
    sync.requestSync();
  }

  async function remove(doc: DisplayDocument) {
    if (doc.pending) {
      await removePendingFile(doc.pending);
      await sync.refreshOutbox();
      return;
    }
    if (!sync.isOnline) throw new Error('Reconnect to remove a file that is already uploaded.');
    if (doc.server) await removeDocument(doc.server);
    await queryClient.invalidateQueries({ queryKey: applicationKeys.all });
  }

  return { pending, attach, remove };
}

/**
 * The student's draft for one college, merged from the server and this device
 * (SRS 3.1.1.4). Every edit is saved locally first and synced in the background.
 */
export function useOfflineDraft(collegeId: string) {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const sync = useSync();
  const queryClient = useQueryClient();
  const applications = useMyApplications();

  const serverDraft =
    applications.data?.find((a) => a.college_id === collegeId && a.status === 'draft') ?? null;
  const local = sync.localDrafts.find((d) => d.college_id === collegeId) ?? null;
  const id = local?.id ?? serverDraft?.id ?? null;
  const detail = useApplication(serverDraft?.id);
  const queue = useDocumentQueue(id);

  const isDeleted = local?.deleted === 1;
  const draft =
    id && !isDeleted
      ? {
          id,
          program_id: local?.program_id ?? serverDraft!.program_id,
          second_program_id: local
            ? local.second_program_id
            : (serverDraft?.second_program_id ?? null),
          essay: local ? local.essay : (detail.data?.essay ?? null),
          existsOnServer: Boolean(serverDraft),
          hasLocalChanges: Boolean(local) || queue.pending.length > 0,
          conflict: local?.conflict_json
            ? (JSON.parse(local.conflict_json) as {
                program_id: string;
                second_program_id: string | null;
                essay: string | null;
                updated_at: string;
              })
            : null,
          syncError:
            local?.sync_error ?? queue.pending.find((p) => p.sync_error)?.sync_error ?? null,
        }
      : null;

  const documents = draft ? mergeDocuments(detail.data?.documents ?? [], queue.pending) : [];

  async function save(fields: {
    programId: string;
    secondProgramId: string | null;
    essay: string | null;
  }) {
    const savedId = await saveLocalDraft({
      id: id ?? undefined,
      userId,
      collegeId,
      programId: fields.programId,
      secondProgramId: fields.secondProgramId,
      essay: fields.essay,
      baseUpdatedAt: serverDraft?.updated_at ?? null,
    });
    await sync.refreshOutbox();
    sync.requestSync();
    return savedId;
  }

  async function deleteDraft() {
    if (!draft) return;
    await deleteLocalDraft({
      id: draft.id,
      userId,
      collegeId,
      programId: draft.program_id,
      existsOnServer: draft.existsOnServer,
    });
    await sync.refreshOutbox();
    sync.requestSync();
  }

  /** Final submission is online-only (SRS 3.6.3): flush the outbox, then submit on the server. */
  async function submit() {
    if (!draft) return;
    if (!sync.isOnline)
      throw new Error('You are offline. Your draft is saved — reconnect to submit.');
    await sync.requestSync();
    const [drafts, files] = await Promise.all([listLocalDrafts(userId), listPendingFiles(userId)]);
    const stuck =
      drafts.some((d) => d.id === draft.id) || files.some((f) => f.application_id === draft.id);
    if (stuck) {
      throw new Error('Some changes are still uploading. Check your connection and try again.');
    }
    await submitApplication(draft.id);
    await queryClient.invalidateQueries({ queryKey: applicationKeys.all });
  }

  async function resolveConflict(choice: 'mine' | 'server') {
    if (!draft) return;
    if (choice === 'mine') await keepLocalVersion(draft.id);
    else await keepServerVersion(draft.id);
    await sync.refreshOutbox();
    sync.requestSync();
  }

  return {
    draft,
    documents,
    isLoading: applications.isPending,
    save,
    attach: queue.attach,
    removeDocument: queue.remove,
    deleteDraft,
    submit,
    resolveConflict,
  };
}
