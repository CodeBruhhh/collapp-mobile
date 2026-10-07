import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';

export type Bucket = 'documents' | 'attachments' | 'college-media' | 'avatars';

export type LocalFile = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Unique object path inside the owner's folder, e.g. `{uid}/{uuid}.pdf`. */
export function objectPath(folder: string, mimeType: string): string {
  const ext = EXTENSIONS[mimeType] ?? 'bin';
  return `${folder}/${Crypto.randomUUID()}.${ext}`;
}

/** Upload a local file (from a picker or scanner) and return its storage path. */
export async function uploadFile(bucket: Bucket, path: string, file: LocalFile): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Files must be 5 MB or smaller.');
  const body = await new File(file.uri).arrayBuffer();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, body, { contentType: file.mimeType, upsert: false });
  if (error) throw error;
  return path;
}

export async function removeFile(bucket: Bucket, path: string) {
  await supabase.storage.from(bucket).remove([path]);
}

/** Short-lived link for private buckets (documents, attachments). */
export async function signedUrl(bucket: Bucket, path: string, expiresIn = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** Permanent link for public buckets (college-media, avatars). */
export function publicUrl(bucket: Bucket, path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
