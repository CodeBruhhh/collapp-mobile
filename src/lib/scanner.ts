import { compressImage, pickPhoto } from '@/lib/pickers';
import type { LocalFile } from '@/lib/storage';

type ScannerModule = typeof import('react-native-document-scanner-plugin').default;

let scanner: ScannerModule | null | undefined;

/** Most pages one requirement's scan may have; they are combined into one PDF. */
export const MAX_SCAN_PAGES = 10;

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

export type ScanResult = {
  pages: LocalFile[];
  /** Pages beyond `maxPages` that were left out (iOS has no in-scanner limit). */
  dropped: number;
};

/**
 * SRS 3.1.1.3 — open the native document scanner (ML Kit on Android, VisionKit
 * on iOS) which handles edge detection, perspective correction, auto-crop and
 * enhancement filters. Several pages can be scanned in one go; each is
 * re-encoded under the 2 MB upload target. Falls back to a single camera photo
 * when the scanner isn't in this build. Returns null when the user cancels.
 */
export async function scanPages(
  maxPages = MAX_SCAN_PAGES,
  name = 'scan.jpg',
): Promise<ScanResult | null> {
  const native = getScanner();
  if (!native) {
    const photo = await pickPhoto('camera');
    return photo ? { pages: [photo], dropped: 0 } : null;
  }

  const { scannedImages, status } = await native.scanDocument({
    maxNumDocuments: maxPages,
    croppedImageQuality: 100,
  });
  if (status === 'cancel' || !scannedImages?.length) return null;

  const base = name.replace(/\.[^.]+$/, '');
  const kept = scannedImages.slice(0, maxPages);
  const pages: LocalFile[] = [];
  // One at a time: full-resolution pages decoded together can exhaust memory.
  for (const [i, path] of kept.entries()) {
    const uri = path.startsWith('file://') ? path : `file://${path}`;
    pages.push(await compressImage(uri, kept.length > 1 ? `${base} p${i + 1}.jpg` : name));
  }
  return { pages, dropped: scannedImages.length - kept.length };
}
