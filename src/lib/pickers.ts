import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import {
  ATTACHMENT_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  type LocalFile,
} from '@/lib/storage';

/** Scans and photos are shrunk to stay under the 2 MB upload target (SRS 3.4). */
const TARGET_IMAGE_BYTES = 2 * 1024 * 1024;

/** Re-encode a photo as JPEG, lowering size/quality until it fits the target. */
export async function compressImage(uri: string, name = 'photo.jpg'): Promise<LocalFile> {
  const attempts = [
    { width: 2000, compress: 0.8 },
    { width: 1600, compress: 0.7 },
    { width: 1280, compress: 0.6 },
  ];
  let result: LocalFile | null = null;
  for (const { width, compress } of attempts) {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ width });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({ compress, format: SaveFormat.JPEG });
    result = {
      uri: saved.uri,
      name: name.replace(/\.[^.]+$/, '') + '.jpg',
      mimeType: 'image/jpeg',
      size: new File(saved.uri).size,
    };
    if (result.size <= TARGET_IMAGE_BYTES) break;
  }
  return result!;
}

/** Let the user pick a PDF or image from files. Returns null when cancelled. */
export async function pickDocumentFile(): Promise<LocalFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: [...DOCUMENT_MIME_TYPES],
    copyToCacheDirectory: true,
  });
  if (res.canceled) return null;
  const asset = res.assets[0];
  const mimeType = asset.mimeType ?? 'application/octet-stream';
  if (!(DOCUMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error('Choose a PDF, JPG, PNG or WEBP file.');
  }
  if (mimeType.startsWith('image/')) return compressImage(asset.uri, asset.name);
  const size = asset.size ?? new File(asset.uri).size;
  if (size > MAX_UPLOAD_BYTES) throw new Error('PDFs must be 5 MB or smaller.');
  return { uri: asset.uri, name: asset.name, mimeType, size };
}

/** A chat attachment: PDF, Word or image (images are compressed). Null when cancelled. */
export async function pickAttachmentFile(): Promise<LocalFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: [...ATTACHMENT_MIME_TYPES],
    copyToCacheDirectory: true,
  });
  if (res.canceled) return null;
  const asset = res.assets[0];
  const mimeType = asset.mimeType ?? 'application/octet-stream';
  if (!(ATTACHMENT_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new Error('Attach a PDF, Word document or image.');
  }
  if (mimeType.startsWith('image/')) return compressImage(asset.uri, asset.name);
  const size = asset.size ?? new File(asset.uri).size;
  if (size > MAX_UPLOAD_BYTES) throw new Error('Attachments must be 5 MB or smaller.');
  return { uri: asset.uri, name: asset.name, mimeType, size };
}

/** Take or choose a photo; it is compressed before upload. Returns null when cancelled. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<LocalFile | null> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error(
      source === 'camera'
        ? 'Camera access is off. Enable it in Settings to take photos of documents.'
        : 'Photo access is off. Enable it in Settings to attach photos.',
    );
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  const res =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled) return null;
  const asset = res.assets[0];
  return compressImage(asset.uri, asset.fileName ?? 'photo.jpg');
}
