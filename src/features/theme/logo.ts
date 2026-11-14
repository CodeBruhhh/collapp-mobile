import * as upngModule from '@pdf-lib/upng';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { lightColors } from '@/styles';

import { brandFromSwatches, logoSwatches } from './palette';
import type { CollegeTheme } from './schema';

// The package's types list named exports, but its build only has a default one.
const UPNG = (upngModule as unknown as { default?: typeof upngModule }).default ?? upngModule;

/** Logos are sampled at this size: enough for their colours, quick to read. */
const SAMPLE_EDGE = 64;

/** CollApp's own colours, used when a logo has no usable colour. */
const APP_BRAND = {
  primary: lightColors.primary,
  secondary: lightColors.status.submitted,
  accent: lightColors.status.underReview,
};

/**
 * Read a small copy of the logo as RGBA pixels. PNG keeps transparency, so a
 * transparent background is never mistaken for a colour.
 */
async function samplePixels(uri: string) {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  try {
    const context = ImageManipulator.manipulate(original);
    if (Math.max(original.width, original.height) > SAMPLE_EDGE) {
      context.resize(
        original.width >= original.height
          ? { width: SAMPLE_EDGE, height: null }
          : { width: null, height: SAMPLE_EDGE },
      );
    }
    const small = await context.renderAsync();
    const saved = await small.saveAsync({ format: SaveFormat.PNG });
    small.release();
    const file = new File(saved.uri);
    const bytes = await file.bytes();
    file.delete();
    const png = UPNG.decode(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
    );
    return { rgba: new Uint8Array(UPNG.toRGBA8(png)[0]), width: png.width, height: png.height };
  } finally {
    original.release();
  }
}

/**
 * A college page theme from its logo: three brand colours plus the logo's
 * other main colours as quick choices. `uri` may be a local file or the
 * logo's public link.
 */
export async function themeFromLogo(uri: string): Promise<CollegeTheme> {
  let downloaded: File | null = null;
  try {
    let local = uri;
    if (/^https?:\/\//.test(uri)) {
      downloaded = await File.downloadFileAsync(
        uri,
        new File(Paths.cache, `logo-${Crypto.randomUUID()}`),
      );
      local = downloaded.uri;
    }
    const { rgba, width, height } = await samplePixels(local);
    const swatches = logoSwatches(rgba, width, height);
    if (!swatches.length) {
      throw new Error('No colors found in this logo. Pick your colors below instead.');
    }
    return {
      ...brandFromSwatches(swatches, APP_BRAND),
      source: 'logo',
      palette: swatches.map((s) => s.hex),
    };
  } finally {
    if (downloaded?.exists) downloaded.delete();
  }
}
