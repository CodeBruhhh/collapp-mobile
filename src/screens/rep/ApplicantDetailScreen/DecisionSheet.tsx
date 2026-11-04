import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createDecisionStyles } from './DecisionSheet.styles';

export type Decision = 'accept' | 'reject';
type Program = { id: string; name: string };

type DecisionSheetProps = {
  visible: boolean;
  onClose: () => void;
  studentFirstName: string;
  collegeName: string;
  programs: Program[];
  /** Admitting needs every document approved; declining is always possible. */
  canAdmit: boolean;
  submitting: boolean;
  onSubmit: (input: {
    decision: Decision;
    programId: string | null;
    message: string;
  }) => Promise<void>;
};

const MESSAGE_MAX = 2000;

/** Starting text for each decision; the representative edits it before sending. */
function template(decision: Decision, name: string, program: string, college: string): string {
  return decision === 'accept'
    ? `Congratulations, ${name}! We are pleased to offer you admission to ${program} at ${college}. We will send the next steps for enrollment soon.`
    : `Thank you for applying to ${college}, ${name}. After careful review, we are unable to offer you admission at this time. We wish you every success in your studies.`;
}

/** SDD screen 21 — the final admission decision, in a sheet that stays above the keyboard. */
export function DecisionSheet({
  visible,
  onClose,
  studentFirstName,
  collegeName,
  programs,
  canAdmit,
  submitting,
  onSubmit,
}: DecisionSheetProps) {
  const { colors } = useTheme();
  const styles = createDecisionStyles(colors);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [programId, setProgramId] = useState<string | null>(
    programs.length === 1 ? programs[0].id : null,
  );
  const [message, setMessage] = useState('');
  // Only replace the text with a new template while the rep hasn't edited it.
  const [edited, setEdited] = useState(false);

  const programName = programs.find((p) => p.id === programId)?.name ?? programs[0]?.name ?? '';

  function choose(next: Decision) {
    setDecision(next);
    if (!edited) setMessage(template(next, studentFirstName, programName, collegeName));
  }

  function chooseProgram(id: string) {
    setProgramId(id);
    const name = programs.find((p) => p.id === id)?.name ?? '';
    if (decision === 'accept' && !edited) {
      setMessage(template('accept', studentFirstName, name, collegeName));
    }
  }

  const ready =
    decision !== null && message.trim().length > 0 && (decision === 'reject' || programId !== null);

  function confirm() {
    if (!decision) return;
    const accepting = decision === 'accept';
    Alert.alert(
      accepting ? `Admit ${studentFirstName}?` : 'Decline this application?',
      'The student is notified right away. This cannot be changed later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: accepting ? 'Admit' : 'Decline',
          style: accepting ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await onSubmit({
                decision,
                programId: accepting ? programId : null,
                message: message.trim(),
              });
              onClose();
            } catch (e) {
              Alert.alert('Could not send the decision', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
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
                          {i === 0 ? 'First choice' : 'Second choice'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
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
                {edited ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      setMessage(template(decision, studentFirstName, programName, collegeName));
                      setEdited(false);
                    }}
                    hitSlop={8}
                    style={styles.reset}>
                    <Icon name="refresh" size={14} color={colors.primary} />
                    <Text style={styles.resetText}>Use template</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text style={styles.prompt}>Choose a decision to write the message.</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              variant={decision === 'reject' ? 'danger' : 'primary'}
              label={decision === 'reject' ? 'Send decision' : 'Send admission'}
              onPress={confirm}
              loading={submitting}
              disabled={!ready}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
