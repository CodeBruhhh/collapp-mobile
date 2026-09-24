import type { ApplicationStatus } from '@/types/models';
import type { ThemeColors } from '@/styles';

type StatusMeta = {
  label: string;
  /** Key into ThemeColors['status']. */
  colorKey: keyof ThemeColors['status'];
  /** 0-1 position on the progress bar. */
  progress: number;
};

/** Milestones from SRS 3.2.2. */
export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  draft: { label: 'Draft', colorKey: 'draft', progress: 0.2 },
  submitted: { label: 'Submitted', colorKey: 'submitted', progress: 0.5 },
  under_review: { label: 'Under Review', colorKey: 'underReview', progress: 0.75 },
  accepted: { label: 'Accepted', colorKey: 'accepted', progress: 1 },
  action_required: { label: 'Action Required', colorKey: 'actionRequired', progress: 0.6 },
};

export const STATUS_ORDER: ApplicationStatus[] = [
  'action_required',
  'draft',
  'submitted',
  'under_review',
  'accepted',
];
