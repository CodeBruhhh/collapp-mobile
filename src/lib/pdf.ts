import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { PDFDocument } from 'pdf-lib';

import { compressImage } from '@/lib/pickers';
import { MAX_UPLOAD_BYTES, type LocalFile } from '@/lib/storage';

/** A4 width in PDF points; each page keeps its own scan's shape. */
const PAGE_WIDTH = 595.28;
/** Kept free under the upload limit for the PDF's own structure. */
const PDF_OVERHEAD_BYTES = 64 * 1024;

/**
 * Combine scanned pages (JPEGs) into one PDF, in order, for a single
 * requirement. The JPEGs are embedded as-is, so the PDF is about as large as
 * the pages together; pages are shrunk further when they would not fit.
 */
export async function pagesToPdf(pages: LocalFile[], name: string): Promise<LocalFile> {
  const budget = Math.floor((MAX_UPLOAD_BYTES - PDF_OVERHEAD_BYTES) / pages.length);

  const doc = await PDFDocument.create();
  const title = name.replace(/\.[^.]+$/, '');
  doc.setTitle(title);
  doc.setCreator('CollApp');
  doc.setProducer('CollApp');

  for (const page of pages) {
    const fitted = page.size > budget ? await compressImage(page.uri, page.name, budget) : page;
    const image = await doc.embedJpg(await new File(fitted.uri).bytes());
    const height = PAGE_WIDTH * (image.height / image.width);
    doc.addPage([PAGE_WIDTH, height]).drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH, height });
  }

  const file = new File(Paths.cache, `${Crypto.randomUUID()}.pdf`);
  file.create();
  file.write(await doc.save());
  if (file.size > MAX_UPLOAD_BYTES) {
    file.delete();
    throw new Error(
      `${pages.length} pages are too large for one file (5 MB). Remove a page and try again.`,
    );
  }
  return { uri: file.uri, name: `${title}.pdf`, mimeType: 'application/pdf', size: file.size };
}
