import { supabase } from '@/lib/supabase';
import type { Database, Enums } from '@/types/database';

import type { ApplicantFilter } from './api';

/** One row of the review queue (the review_queue_items view). */
export type QueueItem = Database['public']['Views']['review_queue_items']['Row'];

/** Quick views: ready-made slices of the queue for a busy admissions season. */
export type QueueView = 'ready' | 'missing' | 'flagged' | 'waiting';
export type QueueSort = 'newest' | 'oldest' | 'fit' | 'name';
/** null = anyone, 'me', 'none' (unassigned) or a reviewer's id. */
export type QueueAssignee = string | null;

export type QueueFilters = {
  status: ApplicantFilter;
  view: QueueView | null;
  programId: string | null;
  assignee: QueueAssignee;
  search: string;
  sort: QueueSort;
  /** Shortlist: the top undecided applicants by AI fit, as many as the open seats. */
  shortlist: number | null;
};

export const DEFAULT_QUEUE_FILTERS: QueueFilters = {
  status: 'all',
  view: null,
  programId: null,
  assignee: null,
  search: '',
  sort: 'newest',
  shortlist: null,
};

export const QUEUE_PAGE_SIZE = 30;

const STATUS_OF: Record<ApplicantFilter, Enums<'application_status'> | null> = {
  all: null,
  new: 'submitted',
  review: 'under_review',
  resubmission: 'action_required',
  accepted: 'accepted',
  rejected: 'rejected',
};

const UNDECIDED: Enums<'application_status'>[] = ['submitted', 'under_review', 'action_required'];

/** LIKE wildcards in a typed name would match everything; drop them. */
const cleanSearch = (term: string) => term.trim().replace(/[%_]/g, '');

/** One page of the queue, filtered, sorted and counted by the database. */
export async function fetchQueuePage(
  collegeId: string,
  userId: string,
  filters: QueueFilters,
  offset: number,
): Promise<{ rows: QueueItem[]; total: number }> {
  let query = supabase
    .from('review_queue_items')
    .select('*', { count: 'exact' })
    .eq('college_id', collegeId);

  if (filters.programId) query = query.eq('program_id', filters.programId);
  if (filters.assignee === 'me') query = query.eq('assigned_to', userId);
  else if (filters.assignee === 'none') query = query.is('assigned_to', null);
  else if (filters.assignee) query = query.eq('assigned_to', filters.assignee);
  const term = cleanSearch(filters.search);
  if (term) query = query.ilike('student_name', `%${term}%`);

  if (filters.shortlist) {
    // Undecided and not already held, best fit first, one per open seat.
    const { data, error, count } = await query
      .in('status', UNDECIDED)
      .is('held_decision', null)
      .order('fit_score', { ascending: false, nullsFirst: false })
      .order('submitted_at', { ascending: true })
      .range(0, filters.shortlist - 1);
    if (error) throw error;
    return { rows: data, total: Math.min(count ?? data.length, filters.shortlist) };
  }

  const status = STATUS_OF[filters.status];
  if (status) query = query.eq('status', status);
  if (filters.view) query = query.eq(`is_${filters.view}`, true);

  switch (filters.sort) {
    case 'oldest':
      query = query.order('submitted_at', { ascending: true });
      break;
    case 'fit':
      query = query.order('fit_score', { ascending: false, nullsFirst: false });
      break;
    case 'name':
      query = query.order('student_name', { ascending: true });
      break;
    default:
      query = query.order('submitted_at', { ascending: false });
  }
  // A unique tiebreaker keeps pages from repeating or skipping rows.
  const { data, error, count } = await query
    .order('id')
    .range(offset, offset + QUEUE_PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: data, total: count ?? data.length };
}

export type QueueCounts = {
  status: Record<ApplicantFilter, number>;
  views: Record<QueueView, number>;
};

/** Tab counts (within the chosen quick view) and quick-view counts. */
export async function fetchQueueCounts(
  filters: Pick<QueueFilters, 'programId' | 'assignee' | 'search' | 'view'>,
): Promise<QueueCounts> {
  const { data, error } = await supabase.rpc('review_queue_counts', {
    p_program_id: filters.programId,
    p_assignee: filters.assignee,
    p_search: cleanSearch(filters.search) || null,
    p_view: filters.view,
  });
  if (error) throw error;
  return data as QueueCounts;
}

export type ProgramSeats = { slots: number | null; admitted: number; held: number };

/** Admissions sent and held per program, against its slots. */
export async function fetchProgramSeats(): Promise<Map<string, ProgramSeats>> {
  const { data, error } = await supabase.rpc('program_seats');
  if (error) throw error;
  return new Map(
    data.map((r) => [r.program_id, { slots: r.slots, admitted: r.admitted, held: r.held }]),
  );
}

/** Seats already promised (sent or held); null when the program has no limit. */
export function seatsLeft(seats: ProgramSeats | undefined): number | null {
  if (!seats || seats.slots === null) return null;
  return seats.slots - seats.admitted - seats.held;
}

export type Reviewer = { id: string; full_name: string };

export async function fetchReviewers(): Promise<Reviewer[]> {
  const { data, error } = await supabase.rpc('college_reviewers');
  if (error) throw error;
  return data;
}

/** Give applications to a reviewer of the college, or unassign them (null). */
export async function assignApplications(applicationIds: string[], assignee: string | null) {
  const { error } = await supabase.rpc('assign_applications', {
    p_application_ids: applicationIds,
    p_assignee: assignee,
  });
  if (error) throw error;
}
