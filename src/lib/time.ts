const DAY_MS = 24 * 60 * 60 * 1000;

/** Compact inbox/notification time: "2:41 PM", "Tue", or "Oct 3". */
export function shortTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (now.getTime() - date.getTime() < 6 * DAY_MS) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Chat bubble time: always the clock time. */
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Group heading for a list: "Today", "Yesterday", or "Oct 3". */
export function dayLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === new Date(now.getTime() - DAY_MS).toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
