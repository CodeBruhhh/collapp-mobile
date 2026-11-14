/**
 * Brand colours for a college page: picked from its logo, adjustable by its
 * representatives, and adapted to the light and dark themes so text on them
 * stays readable (WCAG AA). Pure functions only, no React Native.
 */
import type { ThemeColors } from '@/styles';

export type BrandColors = { primary: string; secondary: string; accent: string };

/** One of a logo's main colours; `share` is its fraction of the logo (0-1). */
export type Swatch = { hex: string; share: number; chroma: number; lightness: number };

type Rgb = [number, number, number];
type Lab = [number, number, number];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// --- Conversions -------------------------------------------------------------

/** '#abc', 'abc', '#aabbcc' or 'AABBCC' as '#AABBCC'; null when it isn't a colour. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  const full = /^[0-9a-f]{3}$/i.test(raw)
    ? raw
        .split('')
        .map((ch) => ch + ch)
        .join('')
    : raw;
  return /^[0-9a-f]{6}$/i.test(full) ? `#${full.toUpperCase()}` : null;
}

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((v) =>
      Math.round(clamp(v, 0, 255))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === rn
      ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r, g, b] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = l - c / 2;
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** sRGB channel (0-255) to linear light. */
const linear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

function rgbToLab([r, g, b]: Rgb): Lab {
  const [lr, lg, lb] = [linear(r), linear(g), linear(b)];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f((lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047);
  const fy = f(lr * 0.2126 + lg * 0.7152 + lb * 0.0722);
  const fz = f((lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** Perceptual distance (CIE76): under ~10 looks alike, over ~25 clearly different. */
const deltaE = (a: Lab, b: Lab) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const labOf = (hex: string) => rgbToLab(hexToRgb(hex));

// --- Contrast ------------------------------------------------------------------

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio between two colours (1-21). */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Blend `a` over `b`: 0 gives `b`, 1 gives `a`. */
export function mix(a: string, b: string, amount: number): string {
  const [ra, ga, ba] = hexToRgb(a);
  const [rb, gb, bb] = hexToRgb(b);
  return rgbToHex([rb + (ra - rb) * amount, gb + (ga - gb) * amount, bb + (ba - bb) * amount]);
}

/** The same hue and saturation at another lightness (0-1). */
function atLightness(hex: string, lightness: number): string {
  const [h, s] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb(h, s, clamp(lightness, 0, 1)));
}

/**
 * The colour nearest to `hex` (same hue, lightness moved in `direction`) that
 * reaches `ratio` against every colour in `against`.
 */
export function withContrast(
  hex: string,
  against: string[],
  ratio: number,
  direction: 'darker' | 'lighter',
): string {
  const passes = (c: string) => against.every((bg) => contrast(c, bg) >= ratio);
  if (passes(hex)) return hex;
  const [, , l] = rgbToHsl(hexToRgb(hex));
  for (let step = 1; step <= 100; step++) {
    const next = direction === 'darker' ? l - step / 100 : l + step / 100;
    if (next < 0 || next > 1) break;
    const candidate = atLightness(hex, next);
    if (passes(candidate)) return candidate;
  }
  return direction === 'darker' ? '#000000' : '#FFFFFF';
}

/** Lighter-to-darker steps of one colour, for fine-tuning a pick. */
export function shadesOf(hex: string, steps = 7): string[] {
  return Array.from({ length: steps }, (_, i) => atLightness(hex, 0.85 - (0.7 * i) / (steps - 1)));
}

// --- Picking colours from a logo ---------------------------------------------------

/** Below this alpha a pixel is treated as transparent background. */
const OPAQUE_ALPHA = 160;
/** Pixels this close to the background colour are background (anti-aliasing included). */
const BACKGROUND_DISTANCE = 14;
/** Colours closer than this merge into one swatch. */
const MERGE_DISTANCE = 16;
/** Swatches covering less of the logo than this are noise (edges, tiny details). */
const MIN_SHARE = 0.02;
/** Brand colours must differ at least this much from each other. */
const DISTINCT = 22;

type Bucket = { r: number; g: number; b: number; n: number };

const mean = (k: Bucket): Rgb => [k.r / k.n, k.g / k.n, k.b / k.n];

/**
 * The logo's main colours, most brand-like first. `rgba` is 8-bit RGBA pixel
 * data of a small copy of the logo. Transparent pixels and a solid background
 * (the colour most of the border shares) are left out, and near-duplicate
 * colours are merged.
 */
export function logoSwatches(rgba: Uint8Array, width: number, height: number, max = 6): Swatch[] {
  const px = (i: number): Rgb => [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]];
  const opaque = (i: number) => rgba[i * 4 + 3] >= OPAQUE_ALPHA;
  // 4 bits per channel: 4096 boxes, plenty for a logo.
  const key = (i: number) =>
    ((rgba[i * 4] >> 4) << 8) | ((rgba[i * 4 + 1] >> 4) << 4) | (rgba[i * 4 + 2] >> 4);
  const add = (map: Map<number, Bucket>, i: number) => {
    const k = key(i);
    const [r, g, b] = px(i);
    const bucket = map.get(k);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.n += 1;
    } else map.set(k, { r, g, b, n: 1 });
  };

  // 1. Background: a colour shared by most of the (opaque) border.
  const border = new Set<number>();
  for (let x = 0; x < width; x++) border.add(x).add((height - 1) * width + x);
  for (let y = 0; y < height; y++) border.add(y * width).add(y * width + width - 1);
  const borderBuckets = new Map<number, Bucket>();
  for (const i of border) if (opaque(i)) add(borderBuckets, i);
  const top = [...borderBuckets.values()].sort((a, b) => b.n - a.n)[0];
  const background = top && top.n >= border.size * 0.4 ? rgbToLab(mean(top)) : null;

  // 2. Histogram of the logo's own pixels.
  const buckets = new Map<number, Bucket>();
  let total = 0;
  for (let i = 0; i < width * height; i++) {
    if (!opaque(i)) continue;
    if (background && deltaE(rgbToLab(px(i)), background) < BACKGROUND_DISTANCE) continue;
    add(buckets, i);
    total += 1;
  }
  if (!total) return [];

  // 3. Merge similar boxes, biggest first, into swatches.
  const clusters: { sum: Bucket; lab: Lab }[] = [];
  for (const bucket of [...buckets.values()].sort((a, b) => b.n - a.n)) {
    const lab = rgbToLab(mean(bucket));
    const near = clusters.find((c) => deltaE(c.lab, lab) < MERGE_DISTANCE);
    if (near) {
      near.sum.r += bucket.r;
      near.sum.g += bucket.g;
      near.sum.b += bucket.b;
      near.sum.n += bucket.n;
      near.lab = rgbToLab(mean(near.sum));
    } else clusters.push({ sum: { ...bucket }, lab });
  }

  return clusters
    .map((c) => ({
      hex: rgbToHex(mean(c.sum)),
      share: c.sum.n / total,
      chroma: Math.hypot(c.lab[1], c.lab[2]),
      lightness: c.lab[0],
    }))
    .filter((s) => s.share >= MIN_SHARE)
    .sort((a, b) => brandScore(b) - brandScore(a))
    .slice(0, max);
}

/** Big areas and vivid colours make a colour read as "the brand". */
const brandScore = (s: Swatch) => s.share * (0.3 + Math.min(s.chroma, 80) / 80);
/** White-ish colours can't carry white text or show on a light page. */
const isPale = (s: Swatch) => s.lightness > 90 && s.chroma < 12;

/**
 * Primary, secondary and accent from a logo's swatches. A logo with fewer than
 * three distinct colours gets the missing ones as a shade and a tint of its
 * primary, so the page stays in the logo's colour family.
 */
export function brandFromSwatches(swatches: Swatch[], fallback: BrandColors): BrandColors {
  const usable = swatches.filter((s) => !isPale(s));
  if (!usable.length) return fallback;

  const primary = usable.find((s) => s.chroma >= 15) ?? usable[0];
  const distinctFrom = (s: Swatch, others: Swatch[]) =>
    others.every((o) => deltaE(labOf(s.hex), labOf(o.hex)) >= DISTINCT);
  const secondary = usable.find((s) => s !== primary && distinctFrom(s, [primary]));
  const picked = secondary ? [primary, secondary] : [primary];
  // The accent is the most vivid colour left: often a small but striking detail.
  const accent = [...usable]
    .sort((a, b) => b.chroma - a.chroma)
    .find((s) => !picked.includes(s) && distinctFrom(s, picked));

  const [, , l] = rgbToHsl(hexToRgb(primary.hex));
  return {
    primary: primary.hex,
    secondary: secondary?.hex ?? atLightness(primary.hex, l > 0.45 ? l - 0.22 : l + 0.22),
    accent: accent?.hex ?? mix(primary.hex, '#FFFFFF', 0.45),
  };
}

// --- Fitting brand colours to a theme ------------------------------------------------

/**
 * The app theme repainted in a college's colours: buttons, links, selection
 * and the masthead use its primary, adjusted (darker on light screens, lighter
 * on dark ones) until text on and around it meets 4.5:1.
 */
export function brandPalette(base: ThemeColors, brand: BrandColors, isDark: boolean): ThemeColors {
  const direction = isDark ? 'lighter' : 'darker';
  let primary = brand.primary;
  let primarySoft = base.primarySoft;
  // Selected chips put primary text on primarySoft, which depends on primary itself.
  for (let pass = 0; pass < 3; pass++) {
    primary = withContrast(
      primary,
      [base.background, base.surface, base.onPrimary, primarySoft],
      4.5,
      direction,
    );
    primarySoft = mix(primary, base.surface, isDark ? 0.22 : 0.12);
  }
  return { ...base, primary, primarySoft };
}

/** The accent for icons and marks: at least 3:1 against the page (WCAG non-text contrast). */
export function brandAccent(base: ThemeColors, brand: BrandColors, isDark: boolean): string {
  return withContrast(
    brand.accent,
    [base.background, base.surface, base.surfaceMuted],
    3,
    isDark ? 'lighter' : 'darker',
  );
}
