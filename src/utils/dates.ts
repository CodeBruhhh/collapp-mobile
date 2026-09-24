const DAY_MS = 86_400_000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Whole calendar days from `now` until `iso` (negative if in the past). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / DAY_MS);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function countdownLabel(days: number): string {
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const days = -daysUntil(iso, now);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}
