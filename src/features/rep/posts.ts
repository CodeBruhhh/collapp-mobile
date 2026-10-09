import type { Enums } from '@/types/database';

export type PostType = Enums<'post_type'>;

export const POST_TYPE_LABELS: Record<PostType, string> = {
  news: 'Announcement',
  event: 'Event',
  scholarship: 'Scholarship',
  deadline: 'Deadline',
};
