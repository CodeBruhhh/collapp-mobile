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

// Text colours meet WCAG AA (4.5:1) on both `background` and `surface`.
export const lightColors: ThemeColors = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F3F6',
  border: '#E4E7EC',
  text: '#101828',
  textMuted: '#5D6676',
  primary: '#4F46E5',
  primarySoft: '#EEF0FE',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  status: {
    draft: '#6B7280',
    submitted: '#2563EB',
    underReview: '#B45309',
    accepted: '#15803D',
    actionRequired: '#B91C1C',
    rejected: '#4B5563',
  },
};

export const darkColors: ThemeColors = {
  background: '#0E1117',
  surface: '#171B24',
  surfaceMuted: '#1F2430',
  border: '#2A3040',
  text: '#F2F4F8',
  textMuted: '#A3AAB8',
  primary: '#818CF8',
  primarySoft: '#252A4A',
  onPrimary: '#0E1117',
  danger: '#F87171',
  status: {
    draft: '#9CA3AF',
    submitted: '#60A5FA',
    underReview: '#FBBF24',
    accepted: '#4ADE80',
    actionRequired: '#F87171',
    rejected: '#D1D5DB',
  },
};

/** `#RRGGBB` plus alpha (0-1) as `#RRGGBBAA`, for tinted badge backgrounds. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex.slice(0, 7)}${a}`;
}

// "Editorial Teal" (Figma 6:1930), used by the admin console: warm paper,
// a single deep-teal accent and earthy status hues. Text meets WCAG AA.
export const editorialLightColors: ThemeColors = {
  background: '#F6F4EE',
  surface: '#FDFCF8',
  surfaceMuted: '#EEEBE3',
  border: '#D5DAD1',
  text: '#202F2D',
  textMuted: '#69766F',
  primary: '#174F4B',
  primarySoft: '#E6ECE5',
  onPrimary: '#FDFCF8',
  danger: '#A23B2C',
  status: {
    draft: '#69766F',
    submitted: '#2F5D7C',
    underReview: '#8A5E0E',
    accepted: '#1F6B4A',
    actionRequired: '#A23B2C',
    rejected: '#56605B',
  },
};

export const editorialDarkColors: ThemeColors = {
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
  status: {
    draft: '#9AA59F',
    submitted: '#86B4D4',
    underReview: '#D9AE5B',
    accepted: '#7CC79A',
    actionRequired: '#E57F6E',
    rejected: '#B8C0BB',
  },
};
