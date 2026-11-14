import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/TextField';
import { ToggleRow } from '@/components/ToggleRow';
import {
  fillTemplate,
  templatesFor,
  type MessageTemplate,
  type TemplateKind,
} from '@/features/rep/templates';
import { useTheme } from '@/hooks/useTheme';
import { KeyboardAvoidingView } from '@/lib/keyboard';

import { createDecisionStyles } from './DecisionSheet.styles';

export type Decision = 'accept' | 'reject';
type Program = { id: string; name: string };

/** Seats for a program: its limit (null = none) and admissions already sent or held. */
export type SeatInfo = { slots: number | null; taken: number };

type DecisionSheetProps = {
  visible: boolean;
  onClose: () => void;
  studentFirstName: string;
  studentFullName: string;
  collegeName: string;
  programs: Program[];
  /** The college's saved templates (all kinds); built-in ones are added here. */
  templates: MessageTemplate[];
  /** Seats per program, to warn before admitting past a program's limit. */
  seatsFor?: (programId: string) => SeatInfo | undefined;
  /** Admitting needs every document approved; declining is always possible. */
  canAdmit: boolean;
  submitting: boolean;
  /** Prefill when editing a held decision. */
  initial?: { decision: Decision; programId: string | null; message: string } | null;
  /** Start with "hold for batch release" switched on. */
  defaultHold?: boolean;
  onSubmit: (input: {
    decision: Decision;
    programId: string | null;
    message: string;
    /** Keep it for the next batch release instead of notifying the student now. */
    hold: boolean;
  }) => Promise<void>;
};

const MESSAGE_MAX = 2000;

const KIND: Record<Decision, TemplateKind> = { accept: 'admit', reject: 'decline' };

/** "42 of 50 seats taken", and whether one more admission goes past the limit. */
function seatNote(
  seats: SeatInfo | undefined,
): { text: string; short: string; over: boolean } | null {
  if (!seats || seats.slots === null) return null;
  const over = seats.taken >= seats.slots;
  const taken = `${seats.taken} of ${seats.slots} seats taken`;
  return {
    text: over ? `Full: ${taken}. Admitting goes over the limit.` : taken,
    short: over ? 'Full' : taken,
    over,
  };
}

/** SDD screen 21 — the final admission decision, in a sheet that stays above the keyboard. */
export function DecisionSheet({
  visible,
  onClose,
  studentFirstName,
  studentFullName,
  collegeName,
  programs,
  templates,
  seatsFor,
  canAdmit,
  submitting,
  initial,
  defaultHold,
  onSubmit,
}: DecisionSheetProps) {
  const { colors } = useTheme();
  const styles = createDecisionStyles(colors);
  const [decision, setDecision] = useState<Decision | null>(initial?.decision ?? null);
  const [programId, setProgramId] = useState<string | null>(
    initial?.programId ?? (programs.length === 1 ? programs[0].id : null),
  );
  const [message, setMessage] = useState(initial?.message ?? '');
  // Only replace the text with a new template while the rep hasn't edited it.
  const [edited, setEdited] = useState(Boolean(initial));
  const [confirming, setConfirming] = useState(false);
  const [picking, setPicking] = useState(false);
  // The template in use; refilled (e.g. for another program) until the rep edits the text.
  const [chosen, setChosen] = useState<MessageTemplate | null>(null);
  const [hold, setHold] = useState(Boolean(defaultHold || initial));

  const programName = programs.find((p) => p.id === programId)?.name ?? programs[0]?.name ?? '';
  const seats = decision === 'accept' && programId ? seatNote(seatsFor?.(programId)) : null;

  function fill(t: MessageTemplate, program: string) {
    return fillTemplate(t.body, {
      first_name: studentFirstName,
      full_name: studentFullName,
      program,
      college: collegeName,
    });
  }

  function applyTemplate(t: MessageTemplate, program = programName) {
    setChosen(t);
    setMessage(fill(t, program));
    setEdited(false);
  }

  function choose(next: Decision) {
    setDecision(next);
    // The college's own first template for this decision, else CollApp's.
    if (!edited) applyTemplate(templatesFor(templates, KIND[next])[0]);
  }

  function chooseProgram(id: string) {
    setProgramId(id);
    const name = programs.find((p) => p.id === id)?.name ?? '';
    if (decision === 'accept' && !edited && chosen) setMessage(fill(chosen, name));
  }

  const ready =
    decision !== null && message.trim().length > 0 && (decision === 'reject' || programId !== null);

  const accepting = decision === 'accept';

  async function send() {
    await onSubmit({
      decision: accepting ? 'accept' : 'reject',
      programId: accepting ? programId : null,
      message: message.trim(),
      hold,
    });
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* Keeps the message box and Send button above the keyboard. */}
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              hitSlop={8}
              style={styles.headerSide}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Text accessibilityRole="header" style={styles.title}>
              Final decision
            </Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <View style={styles.options}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: decision === 'accept', disabled: !canAdmit }}
                accessibilityHint={canAdmit ? undefined : 'Approve every document first'}
                disabled={!canAdmit}
                onPress={() => choose('accept')}
                style={[
                  styles.option,
                  decision === 'accept' && styles.optionAdmit,
                  !canAdmit && styles.optionDisabled,
                ]}>
                <Icon
                  name={decision === 'accept' ? 'checkmark-circle-filled' : 'checkmark-circle'}
                  size={28}
                  color={canAdmit ? colors.status.accepted : colors.textMuted}
                />
                <Text style={styles.optionTitle}>Admit</Text>
                <Text style={styles.optionHint}>
                  {canAdmit ? 'Offer a place' : 'Approve all documents first'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: decision === 'reject' }}
                onPress={() => choose('reject')}
                style={[styles.option, decision === 'reject' && styles.optionDecline]}>
                <Icon
                  name={decision === 'reject' ? 'close-circle-filled' : 'close-circle'}
                  size={28}
                  color={colors.danger}
                />
                <Text style={styles.optionTitle}>Decline</Text>
                <Text style={styles.optionHint}>Close the application</Text>
              </Pressable>
            </View>

            {decision === 'accept' && programs.length > 1 ? (
              <View style={styles.group}>
                <Text style={styles.label}>Admit to</Text>
                {programs.map((p, i) => {
                  const active = p.id === programId;
                  return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      onPress={() => chooseProgram(p.id)}
                      style={[styles.program, active && styles.programActive]}>
                      <Icon
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={active ? colors.primary : colors.textMuted}
                      />
                      <View style={styles.flex}>
                        <Text style={styles.programName}>{p.name}</Text>
                        <Text style={styles.optionHint}>
                          {[
                            i === 0 ? 'First choice' : 'Second choice',
                            seatNote(seatsFor?.(p.id))?.short,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {seats ? (
              <View style={styles.seatNote}>
                <Icon
                  name={seats.over ? 'alert-circle' : 'people'}
                  size={16}
                  color={seats.over ? colors.danger : colors.textMuted}
                />
                <Text style={[styles.seatText, seats.over && styles.seatOver]}>{seats.text}</Text>
              </View>
            ) : null}

            {decision ? (
              <View style={styles.group}>
                <TextField
                  label={`Message to ${studentFirstName}`}
                  value={message}
                  onChangeText={(text) => {
                    setMessage(text);
                    setEdited(true);
                  }}
                  multiline
                  maxLength={MESSAGE_MAX}
                  hint={`${message.length}/${MESSAGE_MAX}`}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Replaces the message with a saved template"
                  onPress={() => setPicking(true)}
                  hitSlop={8}
                  style={styles.reset}>
                  <Icon name="document-text" size={14} color={colors.primary} />
                  <Text style={styles.resetText}>
                    {chosen && !edited ? `Template: ${chosen.title}` : 'Use a template'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.prompt}>Choose a decision to write the message.</Text>
            )}

            {decision ? (
              <ToggleRow
                label="Hold for batch release"
                description="The student hears nothing until you release results from the review queue, so every applicant gets their result at the same time."
                value={hold}
                onChange={setHold}
              />
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              variant={decision === 'reject' && !hold ? 'danger' : 'primary'}
              label={
                hold ? 'Hold decision' : decision === 'reject' ? 'Send decision' : 'Send admission'
              }
              onPress={() => decision && setConfirming(true)}
              loading={submitting}
              disabled={!ready}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      {/* Nested so it opens above this sheet; a failed send stays here with its error. */}
      <ActionSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        eyebrow={hold ? 'Batch release' : 'Final decision'}
        title={
          hold
            ? `Hold this ${accepting ? 'admission' : 'decision'}?`
            : accepting
              ? `Admit ${studentFirstName}?`
              : 'Decline this application?'
        }
        message={[
          seats?.over ? `${programName} is full. This admission goes over its seat limit.` : null,
          hold
            ? 'The student is not notified yet. You can change or withdraw it until you release results.'
            : 'The student is notified right away. This cannot be changed later.',
        ]
          .filter(Boolean)
          .join('\n\n')}
        actions={[
          {
            label: hold ? 'Hold' : accepting ? 'Admit' : 'Decline',
            destructive: !accepting && !hold,
            onPress: send,
          },
        ]}
      />
      <ActionSheet
        visible={picking}
        onClose={() => setPicking(false)}
        eyebrow="Message templates"
        title={decision === 'reject' ? 'Decline message' : 'Admission message'}
        message="Names and the program are filled in for this student."
        actions={[
          ...(decision ? templatesFor(templates, KIND[decision]) : []).map((t) => ({
            label: t.builtIn ? `${t.title} (CollApp)` : t.title,
            hint: preview(fill(t, programName)),
            onPress: () => applyTemplate(t),
          })),
          {
            label: 'Manage templates',
            hint: "Add or edit your college's saved messages",
            onPress: () => {
              onClose();
              router.push('/rep/templates');
            },
          },
        ]}
      />
    </Modal>
  );
}

/** The opening of a message, for a list of choices. */
function preview(text: string): string {
  return text.length > 90 ? `${text.slice(0, 90).trimEnd()}...` : text;
}
