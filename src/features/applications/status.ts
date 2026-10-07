import type { ThemeColors } from '@/styles';
import type { Enums } from '@/types/database';

export type ApplicationStatus = Enums<'application_status'>;
export type ReviewStatus = Enums<'review_status'>;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  action_required: 'Action Required',
  accepted: 'Accepted',
  rejected: 'Not Admitted',
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  resubmit: 'Resubmit',
};

/** Milestone badge colors (SRS 3.2.2). */
export function applicationStatusColor(status: ApplicationStatus, c: ThemeColors): string {
  switch (status) {
    case 'draft':
      return c.status.draft;
    case 'submitted':
      return c.status.submitted;
    case 'under_review':
      return c.status.underReview;
    case 'action_required':
      return c.status.actionRequired;
    case 'accepted':
      return c.status.accepted;
    case 'rejected':
      return c.status.rejected;
  }
}

export function reviewStatusColor(status: ReviewStatus, c: ThemeColors): string {
  switch (status) {
    case 'pending':
      return c.status.underReview;
    case 'approved':
      return c.status.accepted;
    case 'rejected':
      return c.status.rejected;
    case 'resubmit':
      return c.status.actionRequired;
  }
}

/** Progress through the lifecycle, for the tracker's progress bar. */
export function applicationProgress(status: ApplicationStatus): number {
  switch (status) {
    case 'draft':
      return 0.2;
    case 'submitted':
      return 0.45;
    case 'under_review':
    case 'action_required':
      return 0.7;
    case 'accepted':
    case 'rejected':
      return 1;
  }
}

/** Whole days until `date` (negative once passed); null when there is no deadline. */
export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null;
  const end = new Date(`${date}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000);
}

export function deadlineLabel(date: string | null | undefined): string | null {
  const days = daysUntil(date);
  if (days === null) return null;
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} left`;
}
