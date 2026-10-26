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
