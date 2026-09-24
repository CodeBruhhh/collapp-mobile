export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  danger: string;
  /** Application milestone badges (SRS 3.2.2). */
  status: {
    draft: string;
    submitted: string;
    underReview: string;
    accepted: string;
    actionRequired: string;
  };
}

export const lightColors: ThemeColors = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E3E5EA',
  text: '#11131A',
  textMuted: '#5B6070',
  primary: '#4F46E5',
  onPrimary: '#FFFFFF',
  danger: '#C62828',
  status: {
    draft: '#6B7280',
    submitted: '#2563EB',
    underReview: '#B45309',
    accepted: '#15803D',
    actionRequired: '#B91C1C',
  },
};

export const darkColors: ThemeColors = {
  background: '#0E1117',
  surface: '#171B24',
  border: '#2A3040',
  text: '#F2F4F8',
  textMuted: '#A3AAB8',
  primary: '#818CF8',
  onPrimary: '#0E1117',
  danger: '#F87171',
  status: {
    draft: '#9CA3AF',
    submitted: '#60A5FA',
    underReview: '#FBBF24',
    accepted: '#4ADE80',
    actionRequired: '#F87171',
  },
};
