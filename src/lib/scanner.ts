import { compressImage, pickPhoto } from '@/lib/pickers';
import type { LocalFile } from '@/lib/storage';

type ScannerModule = typeof import('react-native-document-scanner-plugin').default;

let scanner: ScannerModule | null | undefined;

/**
 * Load the native scanner lazily: dev builds made before it was added don't
 * contain it, and a top-level import would crash the whole app.
 */
function getScanner(): ScannerModule | null {
  if (scanner === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      scanner = require('react-native-document-scanner-plugin').default as ScannerModule;
    } catch {
      scanner = null;
    }
  }
  return scanner;
}

/** True when the installed build has the native document scanner. */
export function isScannerAvailable(): boolean {
  return getScanner() !== null;
}

/**
 * SRS 3.1.1.3 — open the native document scanner (ML Kit on Android, VisionKit
 * on iOS) which handles edge detection, perspective correction, auto-crop and
 * enhancement filters. The result is re-encoded under the 2 MB upload target.
 * Falls back to a plain camera photo when the scanner isn't in this build.
 * Returns null when the user cancels.
 */
export async function scanDocument(name = 'scan.jpg'): Promise<LocalFile | null> {
  const native = getScanner();
  if (!native) return pickPhoto('camera');

  const { scannedImages, status } = await native.scanDocument({
    maxNumDocuments: 1,
    croppedImageQuality: 100,
  });
  if (status === 'cancel' || !scannedImages?.length) return null;
  const uri = scannedImages[0].startsWith('file://')
    ? scannedImages[0]
    : `file://${scannedImages[0]}`;
  return compressImage(uri, name);
}
