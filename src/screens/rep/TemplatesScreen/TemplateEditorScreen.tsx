import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ChipGroup } from '@/components/ChipGroup';
import { FormScreen } from '@/components/FormScreen';
import { ErrorState, LoadingState } from '@/components/StateView';
import { StickyActionBar } from '@/components/StickyActionBar';
import { TextField } from '@/components/TextField';
import { useMyCollege, useTemplateActions, useTemplates } from '@/features/rep/hooks';
import {
  BUILT_IN_TEMPLATES,
  fillTemplate,
  PLACEHOLDERS,
  TEMPLATE_KINDS,
  TEMPLATE_MAX,
  type MessageTemplate,
  type TemplateKind,
} from '@/features/rep/templates';
import { useTheme } from '@/hooks/useTheme';
import { ask, notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import { createScreenStyles } from '@/screens/screenStyles';

const isKind = (value: string | undefined): value is TemplateKind =>
  TEMPLATE_KINDS.some((k) => k.kind === value);

/**
 * Create or edit a saved message. `kind` picks the type of a new one; `from`
 * names a built-in template to start a copy of.
 */
export function TemplateEditorScreen({
  id,
  kind,
  from,
}: {
  id: string;
  kind?: string;
  from?: string;
}) {
  const templates = useTemplates();
  if (templates.isPending) return <LoadingState variant="detail" />;
  if (templates.isError) return <ErrorState error={templates.error} onRetry={templates.refetch} />;

  const existing = id === 'new' ? null : templates.data.find((t) => t.id === id);
  if (id !== 'new' && !existing) return <ErrorState error={new Error('Template not found.')} />;
  const startKind = isKind(kind) ? kind : 'admit';
  const starter = BUILT_IN_TEMPLATES.find((t) => t.kind === startKind && t.title === from);
  return (
    <TemplateForm
      template={existing ?? null}
      initial={
        existing ?? {
          id: null,
          kind: startKind,
          title: starter ? `${starter.title} (edited)` : '',
          body: starter?.body ?? '',
        }
      }
    />
  );
}

function TemplateForm({
  template,
  initial,
}: {
  template: MessageTemplate | null;
  initial: MessageTemplate;
}) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const actions = useTemplateActions();
  const college = useMyCollege();
  const [kind, setKind] = useState<TemplateKind>(initial.kind);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const max = TEMPLATE_MAX[kind];

  const sample = fillTemplate(body, {
    first_name: 'Maria',
    full_name: 'Maria Santos',
    program: 'BS Nursing',
    college: college.data?.name ?? 'your college',
    document: 'Form 138',
  });

  async function save() {
    const next = {
      title: title.trim() ? undefined : 'Give the template a name',
      body: !body.trim()
        ? 'Write the message'
        : body.trim().length > max
          ? `Keep it under ${max} characters`
          : undefined,
    };
    setErrors(next);
    if (next.title || next.body) return;
    try {
      await actions.save.mutateAsync({ id: template?.id, kind, title, body });
      router.back();
    } catch (e) {
      notify.error('Could not save template', getErrorMessage(e));
    }
  }

  function remove() {
    if (!template?.id) return;
    ask('Delete this template?', template.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.remove.mutateAsync(template.id!);
            router.back();
          } catch (e) {
            notify.error('Could not delete', getErrorMessage(e));
          }
        },
      },
    ]);
  }

  return (
    <FormScreen
      underHeader
      footer={
        <StickyActionBar>
          <View style={styles.flex}>
            <Button label="Save template" onPress={save} loading={actions.save.isPending} />
          </View>
        </StickyActionBar>
      }>
      <Stack.Screen options={{ title: template ? 'Edit template' : 'New template' }} />
      <ChipGroup
        label="Used for"
        options={TEMPLATE_KINDS.map((k) => k.label)}
        selected={[TEMPLATE_KINDS.find((k) => k.kind === kind)!.label]}
        onChange={(next) => {
          const picked = TEMPLATE_KINDS.find((k) => k.label === next[0]);
          if (picked) setKind(picked.kind);
        }}
        max={1}
      />
      <TextField
        label="Name"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        placeholder="e.g. Scholarship admission"
        maxLength={80}
      />
      <TextField
        label="Message"
        value={body}
        onChangeText={setBody}
        error={errors.body}
        hint={`${body.length}/${max}`}
        multiline
        maxLength={max}
      />
      <View style={styles.section}>
        <Text style={styles.meta}>Tap to add a detail that is filled in for each student</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.templateChips}>
          {PLACEHOLDERS.filter((p) => kind === 'resubmit' || p.token !== '{document}').map((p) => (
            <Pressable
              key={p.token}
              accessibilityRole="button"
              accessibilityLabel={`Add ${p.label}`}
              onPress={() =>
                setBody((b) => `${b}${b && !b.endsWith(' ') ? ' ' : ''}${p.token}`.slice(0, max))
              }
              style={({ pressed }) => [styles.templateChip, pressed && styles.pressedChip]}>
              <Text style={styles.templateChipText}>+ {p.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      {body.trim() ? (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Preview</Text>
          <Text style={[styles.body, styles.templatePreview]}>{sample}</Text>
        </View>
      ) : null}
      {template ? <Button variant="link" label="Delete template" onPress={remove} /> : null}
    </FormScreen>
  );
}
