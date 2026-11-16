import type { AiKind } from './api';

/** How each daily AI limit is named to the people it applies to. */
export const AI_KIND_LABELS: Record<AiKind, { label: string; unit: string; hint: string }> = {
  document_check_auto: {
    label: 'AI checks on uploads',
    unit: 'upload checks',
    hint: 'Run automatically when you upload a document',
  },
  document_check: {
    label: 'Document re-checks',
    unit: 're-checks',
    hint: '"Check again" on an uploaded document',
  },
  essay_feedback: {
    label: 'Essay feedback',
    unit: 'feedback requests',
    hint: '"Get AI feedback" while writing your essay',
  },
  essay_summary: {
    label: 'Essay summaries',
    unit: 'summaries',
    hint: '"Summarize with AI" or "Regenerate" on an applicant’s essay',
  },
};

/** "12:00 AM" style reset time in the viewer's clock (limits reset at midnight in Manila). */
export function resetTimeLabel(resetsAt: string | null): string {
  if (!resetsAt) return 'midnight';
  return new Date(resetsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
