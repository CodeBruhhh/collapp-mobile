import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from '@/features/applications/status';

export type StepState = 'done' | 'current' | 'alert' | 'upcoming';
export type TimelineStep = { key: string; label: string; state: StepState; date?: string | null };

const STAGE: Record<ApplicationStatus, number> = {
  draft: 0,
  submitted: 1,
  under_review: 2,
  action_required: 2,
  accepted: 3,
  rejected: 3,
};

/** The milestones of one application (SRS 3.2.2). Only submission and decision have dates. */
export function applicationTimeline(
  status: ApplicationStatus,
  submittedAt?: string | null,
  decidedAt?: string | null,
): TimelineStep[] {
  const stage = STAGE[status];
  const decided = stage === 3;
  const stepState = (at: number): StepState =>
    stage > at ? 'done' : stage === at ? 'current' : 'upcoming';

  return [
    ...(status === 'draft'
      ? [{ key: 'draft', label: APPLICATION_STATUS_LABELS.draft, state: 'current' as const }]
      : []),
    {
      key: 'submitted',
      label: APPLICATION_STATUS_LABELS.submitted,
      state: stepState(1),
      date: submittedAt,
    },
    {
      key: 'under_review',
      label: APPLICATION_STATUS_LABELS.under_review,
      state: status === 'action_required' ? 'done' : stepState(2),
    },
    ...(status === 'action_required'
      ? [
          {
            key: 'action_required',
            label: APPLICATION_STATUS_LABELS.action_required,
            state: 'alert' as const,
          },
        ]
      : []),
    {
      key: 'decision',
      label: decided ? APPLICATION_STATUS_LABELS[status] : 'Decision',
      state: decided ? 'done' : 'upcoming',
      date: decidedAt,
    },
  ];
}
