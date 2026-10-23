import type { Href } from 'expo-router';

import type { Role } from '@/types/roles';

/** The chat screen lives beside each role's tabs. */
export function threadRoute(role: Role, id: string): Href {
  if (role === 'school_rep') return { pathname: '/rep/thread/[id]', params: { id } };
  if (role === 'admin') return { pathname: '/admin/thread/[id]', params: { id } };
  return { pathname: '/student/thread/[id]', params: { id } };
}

export function notificationsRoute(role: Role): Href {
  if (role === 'school_rep') return '/rep/notifications';
  if (role === 'admin') return '/admin/notifications';
  return '/student/notifications';
}

/** Payload stored in notifications.data and echoed in push data. */
type NotificationData = {
  type?: string;
  thread_id?: string;
  application_id?: string;
};

/** Where tapping a notification (in-app or push) should take each role. */
export function notificationTarget(role: Role, type: string, raw: unknown): Href | null {
  const data = (raw ?? {}) as NotificationData;
  if (type === 'new_message' && data.thread_id) return threadRoute(role, data.thread_id);
  if (role === 'student') {
    if (type === 'deadline_reminder') return '/student/applications';
    if ((type === 'application_status' || type === 'document_review') && data.application_id) {
      return { pathname: '/student/application/[id]', params: { id: data.application_id } };
    }
  }
  if (role === 'school_rep' && type === 'new_application' && data.application_id) {
    return { pathname: '/rep/applicant/[id]', params: { id: data.application_id } };
  }
  return null;
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  new_message: 'chatbubble-ellipses-outline',
  application_status: 'school-outline',
  document_review: 'document-attach-outline',
  deadline_reminder: 'alarm-outline',
  new_application: 'person-add-outline',
  broadcast: 'megaphone-outline',
};
