import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { Button } from '@/components/Button';
import { DateField } from '@/components/DateField';
import { InfoRow } from '@/components/InfoRow';
import { Notice } from '@/components/Notice';
import { Select } from '@/components/Select';
import type { ReleaseResult, StagedDecision } from '@/features/rep/api';
import { useReleaseActions } from '@/features/rep/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';

import { createDecisionStyles } from '@/screens/rep/ApplicantDetailScreen/DecisionSheet.styles';

type ReleaseSheetProps = {
  visible: boolean;
  onClose: () => void;
  held: StagedDecision[];
  /** When the batch goes out automatically, if scheduled. */
  releaseAt: string | null;
  /** Applicant names for the failure list. */
  nameOf: (applicationId: string) => string;
};

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Half-hour slots, labelled in the device's 12-hour style. */
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 ? 30 : 0;
  const label = `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`;
  return { label, h, m };
});

/** Release every held decision at once, now or at a scheduled time. */
export function ReleaseSheet({ visible, onClose, held, releaseAt, nameOf }: ReleaseSheetProps) {
  const { colors } = useTheme();
  const styles = createDecisionStyles(colors);
  const actions = useReleaseActions();
  const today = new Date();
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const [date, setDate] = useState(isoDate(today));
  const [time, setTime] = useState('8:00 AM');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<ReleaseResult | null>(null);

  const admits = held.filter((h) => h.decision === 'accepted').length;
  const declines = held.length - admits;

  function scheduledDate(): Date | null {
    const [y, mo, d] = date.split('-').map(Number);
    const slot = TIMES.find((t) => t.label === time);
    if (!y || !mo || !d || !slot) return null;
    return new Date(y, mo - 1, d, slot.h, slot.m);
  }

  async function releaseNow() {
    const r = await actions.release.mutateAsync(undefined);
    setResult(r);
    if (!r.failed.length) {
      notify.success(
        'Results released',
        `${r.released} student${r.released === 1 ? '' : 's'} notified.`,
      );
      onClose();
    }
  }

  async function schedule() {
    const at = scheduledDate();
    if (!at) {
      notify.info('Pick a date and time', 'Choose when the results should go out.');
      return;
    }
    try {
      await actions.schedule.mutateAsync(at);
      notify.success('Release scheduled', at.toLocaleString());
    } catch (e) {
      notify.error('Not scheduled', getErrorMessage(e));
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            hitSlop={8}
            style={styles.headerSide}>
            <Text style={styles.cancel}>Close</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>
            Release results
          </Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          <View style={styles.group}>
            <InfoRow label="Held decisions" value={String(held.length)} />
            <InfoRow label="Admissions" value={String(admits)} />
            <InfoRow label="Declines" value={String(declines)} />
          </View>
          <Text style={styles.prompt}>
            Every held decision goes out together, so all applicants hear back at the same time.
            Each is checked again first; one that no longer qualifies stays held.
          </Text>

          {result?.failed.length ? (
            <View style={styles.group}>
              <Notice
                tone="danger"
                title={`${result.released} released, ${result.failed.length} still held`}
              />
              {result.failed.map((f) => (
                <InfoRow key={f.application_id} label={nameOf(f.application_id)} value={f.error} />
              ))}
            </View>
          ) : null}

          <View style={styles.group}>
            <Text style={styles.label}>Schedule instead</Text>
            {releaseAt ? (
              <Notice
                icon="alarm"
                title={`Scheduled for ${new Date(releaseAt).toLocaleString()}`}
                action={{
                  label: 'Cancel',
                  onPress: () =>
                    actions.schedule
                      .mutateAsync(null)
                      .catch((e) => notify.error('Could not cancel', getErrorMessage(e))),
                }}
              />
            ) : null}
            <DateField
              label="Release date"
              value={date}
              onChange={setDate}
              min={isoDate(today)}
              max={isoDate(nextYear)}
            />
            <Select
              label="Release time"
              value={time}
              options={TIMES.map((t) => t.label)}
              onChange={setTime}
            />
            <Button
              variant="secondary"
              icon="alarm"
              label={releaseAt ? 'Change schedule' : 'Schedule release'}
              onPress={schedule}
              loading={actions.schedule.isPending}
            />
            <Text style={styles.optionHint}>
              Decisions you hold after scheduling go out in the same batch. Times use this
              device&apos;s time zone.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={`Release ${held.length} now`}
            onPress={() => setConfirming(true)}
            loading={actions.release.isPending}
            disabled={held.length === 0}
          />
        </View>
      </SafeAreaView>

      <ActionSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        eyebrow="Batch release"
        title={`Notify ${held.length} student${held.length === 1 ? '' : 's'} now?`}
        message="Every held decision is sent and the students are notified. This cannot be undone."
        actions={[{ label: 'Release now', onPress: releaseNow }]}
      />
    </Modal>
  );
}
