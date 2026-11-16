import { supabase } from '@/lib/supabase';

/** Why a student reported a post or comment (content_reports.reason). */
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'spam', label: 'Spam', hint: 'Ads, scams or the same thing over and over' },
  { value: 'harassment', label: 'Harassment or bullying', hint: 'Attacks or threatens someone' },
  {
    value: 'inappropriate',
    label: 'Inappropriate content',
    hint: 'Offensive, sexual or violent',
  },
  { value: 'misinformation', label: 'False or misleading', hint: 'Wrong dates, fees or claims' },
  { value: 'other', label: 'Something else', hint: 'Anything else an administrator should see' },
];

export const REASON_LABELS = Object.fromEntries(
  REPORT_REASONS.map((r) => [r.value, r.label]),
) as Record<ReportReason, string>;

/** Report a live post (commentId null) or another student's comment to the admins. */
export async function reportContent(input: {
  postId: string;
  commentId: string | null;
  reason: ReportReason;
}) {
  const { error } = await supabase.rpc('report_content', {
    p_post: input.postId,
    p_comment: input.commentId,
    p_reason: input.reason,
  });
  if (error) throw error;
}
