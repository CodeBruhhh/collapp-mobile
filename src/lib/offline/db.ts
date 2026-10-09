import * as SQLite from 'expo-sqlite';

/**
 * On-device outbox for offline drafting (SRS 3.1.1.4, 3.6.3). Rows only exist
 * while a change is waiting to reach the server; a successful sync removes them.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= SQLite.openDatabaseAsync('collapp-offline.db').then(async (db) => {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        college_id TEXT NOT NULL,
        program_id TEXT NOT NULL,
        second_program_id TEXT,
        essay TEXT,
        base_updated_at TEXT,
        local_updated_at TEXT NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        conflict_json TEXT,
        sync_error TEXT
      );
      CREATE TABLE IF NOT EXISTS pending_files (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        application_id TEXT NOT NULL,
        requirement_id TEXT,
        label TEXT NOT NULL,
        uri TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        replaces_document_id TEXT,
        replaces_storage_path TEXT,
        created_at TEXT NOT NULL,
        sync_error TEXT
      );
      CREATE INDEX IF NOT EXISTS drafts_user ON drafts (user_id);
      CREATE INDEX IF NOT EXISTS pending_files_app ON pending_files (application_id);
    `);
    return db;
  });
  return dbPromise;
}

/** A draft change waiting to sync. `base_updated_at` is the server version it was based on. */
export type LocalDraft = {
  id: string;
  user_id: string;
  college_id: string;
  program_id: string;
  second_program_id: string | null;
  essay: string | null;
  base_updated_at: string | null;
  local_updated_at: string;
  deleted: number;
  conflict_json: string | null;
  sync_error: string | null;
};

/** A document picked or scanned on this device, not uploaded yet. */
export type PendingFile = {
  id: string;
  user_id: string;
  application_id: string;
  requirement_id: string | null;
  label: string;
  uri: string;
  mime_type: string;
  size_bytes: number;
  replaces_document_id: string | null;
  replaces_storage_path: string | null;
  created_at: string;
  sync_error: string | null;
};
