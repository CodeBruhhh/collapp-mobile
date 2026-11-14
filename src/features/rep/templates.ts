import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

export type TemplateKind = 'admit' | 'decline' | 'resubmit';

/** A saved template, or one of CollApp's built-in starters (`builtIn`, no id). */
export type MessageTemplate = Pick<Tables<'message_templates'>, 'title' | 'body'> & {
  id: string | null;
  kind: TemplateKind;
  builtIn?: boolean;
};

export const TEMPLATE_KINDS: { kind: TemplateKind; label: string; hint: string }[] = [
  { kind: 'admit', label: 'Admission', hint: 'Sent with an offer of admission' },
  { kind: 'decline', label: 'Decline', hint: 'Sent when an application is declined' },
  { kind: 'resubmit', label: 'Resubmission request', hint: 'Tells a student what to fix' },
];

/** Limits match the database: decision messages 2000, document notes 1000. */
export const TEMPLATE_MAX: Record<TemplateKind, number> = {
  admit: 2000,
  decline: 2000,
  resubmit: 1000,
};

/** Filled in for each student when a template is used. */
export const PLACEHOLDERS = [
  { token: '{first_name}', label: 'First name' },
  { token: '{full_name}', label: 'Full name' },
  { token: '{program}', label: 'Program' },
  { token: '{college}', label: 'College' },
  { token: '{document}', label: 'Document' },
] as const;

export type TemplateValues = Partial<
  Record<'first_name' | 'full_name' | 'program' | 'college' | 'document', string>
>;

/** Replace {placeholders}; any without a value are left for the rep to see and edit. */
export function fillTemplate(body: string, values: TemplateValues): string {
  return body.replace(/\{(first_name|full_name|program|college|document)\}/g, (token, key) => {
    const value = values[key as keyof TemplateValues];
    return value ? value : token;
  });
}

/** Shown before (or alongside) a college's own templates. */
export const BUILT_IN_TEMPLATES: MessageTemplate[] = [
  {
    id: null,
    builtIn: true,
    kind: 'admit',
    title: 'Standard admission',
    body: 'Congratulations, {first_name}! We are pleased to offer you admission to {program} at {college}. We will send the next steps for enrollment soon.',
  },
  {
    id: null,
    builtIn: true,
    kind: 'decline',
    title: 'Standard decline',
    body: 'Thank you for applying to {college}, {first_name}. After careful review, we are unable to offer you admission at this time. We wish you every success in your studies.',
  },
  {
    id: null,
    builtIn: true,
    kind: 'resubmit',
    title: 'Unclear or blurry',
    body: 'Your {document} is hard to read. Please upload a clear scan or photo where every page and detail is readable.',
  },
  {
    id: null,
    builtIn: true,
    kind: 'resubmit',
    title: 'Wrong document',
    body: 'The file uploaded for {document} is not the right document. Please upload your {document}.',
  },
  {
    id: null,
    builtIn: true,
    kind: 'resubmit',
    title: 'Incomplete',
    body: 'Your {document} is missing pages or details. Please upload the complete document, including every page.',
  },
];

/** The college's templates of one kind first, then the built-ins. */
export function templatesFor(saved: MessageTemplate[], kind: TemplateKind): MessageTemplate[] {
  return [
    ...saved.filter((t) => t.kind === kind),
    ...BUILT_IN_TEMPLATES.filter((t) => t.kind === kind),
  ];
}

export async function listTemplates(collegeId: string): Promise<MessageTemplate[]> {
  const { data, error } = await supabase
    .from('message_templates')
    .select('id, kind, title, body')
    .eq('college_id', collegeId)
    .order('title');
  if (error) throw error;
  return data.map((t) => ({ ...t, kind: t.kind as TemplateKind }));
}

export async function saveTemplate(template: {
  id?: string | null;
  collegeId: string;
  kind: TemplateKind;
  title: string;
  body: string;
}) {
  const fields = {
    college_id: template.collegeId,
    kind: template.kind,
    title: template.title.trim(),
    body: template.body.trim(),
  };
  const { error } = template.id
    ? await supabase.from('message_templates').update(fields).eq('id', template.id)
    : await supabase.from('message_templates').insert(fields);
  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('message_templates').delete().eq('id', id);
  if (error) throw error;
}
