export interface ThemeColors {
  background: string;
  surface: string;
  /** Inputs, skeletons and quiet fills inside a surface. */
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  /** The single accent: primary actions, links, selection. */
  primary: string;
  /** Tinted background for selected chips and accent highlights. */
  primarySoft: string;
  onPrimary: string;
  danger: string;
  onDanger: string;
  /** Application milestone badges (SRS 3.2.2). */
  status: {
    draft: string;
    submitted: string;
    underReview: string;
    accepted: string;
    actionRequired: string;
    rejected: string;
  };
}

// "Editorial Teal" (Figma 6:1930): warm paper, a single deep-teal accent and
// earthy status hues. Text colours meet WCAG AA (4.5:1) on `background` and
// `surface`, so `textMuted` is a shade darker than the Figma value.
export const lightColors: ThemeColors = {
  background: '#F6F4EE',
  surface: '#FDFCF8',
  surfaceMuted: '#EEEBE3',
  border: '#D5DAD1',
  text: '#202F2D',
  textMuted: '#5F6C65',
  primary: '#174F4B',
  primarySoft: '#E6ECE5',
  onPrimary: '#FDFCF8',
  danger: '#A23B2C',
  onDanger: '#FFFFFF',
  status: {
    draft: '#5F6C65',
    submitted: '#2F5D7C',
    underReview: '#8A5E0E',
    accepted: '#1F6B4A',
    actionRequired: '#A23B2C',
    rejected: '#56605B',
  },
};

export const darkColors: ThemeColors = {
  background: '#121816',
  surface: '#18201E',
  surfaceMuted: '#202A27',
  border: '#2C3633',
  text: '#E9ECE6',
  textMuted: '#9AA59F',
  primary: '#6FBFB2',
  primarySoft: '#1E3532',
  onPrimary: '#0F1514',
  danger: '#E57F6E',
  onDanger: '#1F0E0B',
  status: {
    draft: '#9AA59F',
    submitted: '#86B4D4',
    underReview: '#D9AE5B',
    accepted: '#7CC79A',
    actionRequired: '#E57F6E',
    rejected: '#B8C0BB',
  },
};

/** Theme-independent: the photo viewer, overlays on photos, and sheet backdrops. */
export const fixedColors = { black: '#000000', white: '#FFFFFF', scrim: '#0B1211' } as const;

/** `#RRGGBB` plus alpha (0-1) as `#RRGGBBAA`, for tinted badge backgrounds. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}
