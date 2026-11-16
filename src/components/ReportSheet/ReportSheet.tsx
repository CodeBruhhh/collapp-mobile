import { ActionSheet } from '@/components/ActionSheet';
import { REPORT_REASONS, reportContent } from '@/features/feed/reports';
import { notify } from '@/lib/feedback';

type ReportSheetProps = {
  /** What is being reported; null keeps the sheet closed. */
  target: { postId: string; commentId: string | null } | null;
  onClose: () => void;
};

/** Pick a reason and send a post or comment to the CollApp administrators. */
export function ReportSheet({ target, onClose }: ReportSheetProps) {
  if (!target) return null;
  const isComment = target.commentId !== null;

  return (
    <ActionSheet
      visible
      onClose={onClose}
      eyebrow="Report"
      title={isComment ? 'Why are you reporting this comment?' : 'Why are you reporting this post?'}
      message="Reports are private. A CollApp administrator reviews them; the person who posted it is not told who reported it."
      actions={REPORT_REASONS.map((r) => ({
        label: r.label,
        hint: r.hint,
        onPress: async () => {
          await reportContent({ ...target, reason: r.value });
          notify.success('Thanks for reporting', 'An administrator will review it.');
        },
      }))}
    />
  );
}
