import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { AiDocumentCheck } from '@/components/AiDocumentCheck';
import { Button } from '@/components/Button';
import { DocumentPreview } from '@/components/DocumentPreview';
import { Icon } from '@/components/Icon';
import { ScanPreview } from '@/components/ScanPreview';
import { StatusBadge } from '@/components/StatusBadge';
import type { DocumentCheck } from '@/features/ai/api';
import type { DisplayDocument } from '@/features/applications/offline';
import { REVIEW_STATUS_LABELS, reviewStatusColor } from '@/features/applications/status';
import type { Requirement } from '@/features/colleges/api';
import { useTheme } from '@/hooks/useTheme';
import { ask, notify } from '@/lib/feedback';
import { pickDocumentFile, pickPhoto } from '@/lib/pickers';
import { MAX_SCAN_PAGES, scanPages } from '@/lib/scanner';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ApplyScreen.styles';

/**
 * iOS can't present the scanner while the review sheet is still sliding away;
 * wait out its close animation first.
 */
const afterSheetCloses = (action: () => void) =>
  setTimeout(action, Platform.OS === 'ios' ? 400 : 0);

type RequirementUploadProps = {
  requirement: Requirement;
  document: DisplayDocument | undefined;
  /** Hide replace/remove once the application is locked for this requirement. */
  locked?: boolean;
  onUpload: (file: LocalFile) => Promise<void>;
  onRemove?: () => Promise<void>;
  /** AI check of the uploaded file (relevant, correct, complete). */
  aiCheck?: DocumentCheck;
  aiAwaiting?: boolean;
  onRecheck?: () => void;
  rechecking?: boolean;
};

/** One document requirement: scan, photograph or pick a file; works offline (SRS 3.1.1.3-4). */
export function RequirementUpload({
  requirement,
  document,
  locked,
  onUpload,
  onRemove,
  aiCheck,
  aiAwaiting,
  onRecheck,
  rechecking,
}: RequirementUploadProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [pages, setPages] = useState<LocalFile[] | null>(null);
  const [busy, setBusy] = useState(false);
  const canChange = !locked && document?.review_status !== 'approved';

  async function save(file: LocalFile) {
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e) {
      notify.error('Could not save the file', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  /** Scan one or more pages; `existing` pages stay in front of the new ones. */
  async function startScan(existing: LocalFile[] = []) {
    try {
      const result = await scanPages(MAX_SCAN_PAGES - existing.length, `${requirement.label}.jpg`);
      if (!result) {
        // Cancelling "add page" keeps the pages already scanned.
        if (existing.length) setPages(existing);
        return;
      }
      setPages([...existing, ...result.pages]);
      if (result.dropped) {
        notify.info(
          `Up to ${MAX_SCAN_PAGES} pages`,
          `${result.dropped} extra page${result.dropped === 1 ? ' was' : 's were'} left out.`,
        );
      }
    } catch (e) {
      if (existing.length) setPages(existing);
      notify.error('Scanner unavailable', getErrorMessage(e));
    }
  }

  /** The scanner opens full screen, so the review sheet steps aside meanwhile. */
  function addPages() {
    const existing = pages ?? [];
    setPages(null);
    afterSheetCloses(() => startScan(existing));
  }

  async function choose(source: 'file' | 'library') {
    try {
      const file = source === 'file' ? await pickDocumentFile() : await pickPhoto('library');
      if (file) await save(file);
    } catch (e) {
      notify.error('Could not add the file', getErrorMessage(e));
    }
  }

  // Android dialogs show at most three buttons, so each prompt offers three.
  function promptReplace() {
    ask(`Replace ${requirement.label}`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose file', onPress: () => choose('file') },
      { text: 'Scan', onPress: () => startScan() },
    ]);
  }

  function promptAttach() {
    ask(requirement.label, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'PDF', onPress: () => choose('file') },
      { text: 'Photo', onPress: () => choose('library') },
    ]);
  }

  return (
    <View style={styles.req}>
      <View style={styles.reqHeader}>
        <Icon
          name={document ? 'checkmark-circle-filled' : 'ellipse'}
          size={20}
          color={document ? colors.status.accepted : colors.textMuted}
        />
        <View style={styles.reqText}>
          <Text style={styles.reqLabel}>
            {requirement.label}
            {requirement.is_required ? '' : ' (optional)'}
          </Text>
          {requirement.description ? (
            <Text style={styles.meta}>{requirement.description}</Text>
          ) : null}
        </View>
      </View>

      {document ? (
        <>
          {document.local ? (
            <StatusBadge label="Saved on this device" color={colors.status.submitted} />
          ) : (
            <StatusBadge
              label={REVIEW_STATUS_LABELS[document.review_status]}
              color={reviewStatusColor(document.review_status, colors)}
            />
          )}
          {document.local && document.syncError ? (
            <Text style={styles.note}>Upload failed: {document.syncError}. Will retry.</Text>
          ) : document.local ? (
            <Text style={styles.meta}>Uploads when you&apos;re online</Text>
          ) : null}
          {document.review_notes ? <Text style={styles.note}>{document.review_notes}</Text> : null}
          <DocumentPreview document={document} />
          {!document.local ? (
            <AiDocumentCheck
              check={aiCheck}
              awaiting={aiAwaiting}
              audience="student"
              onRecheck={onRecheck}
              rechecking={rechecking}
            />
          ) : null}
          {canChange ? (
            <View style={styles.reqActions}>
              <View style={styles.flex}>
                <Button
                  variant="secondary"
                  label="Replace"
                  onPress={promptReplace}
                  loading={busy}
                />
              </View>
              {onRemove ? (
                <View style={styles.flex}>
                  <Button
                    variant="link"
                    label="Remove"
                    disabled={busy}
                    onPress={() =>
                      ask('Remove this file?', requirement.label, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () =>
                            onRemove().catch((e) =>
                              notify.error('Could not remove', getErrorMessage(e)),
                            ),
                        },
                      ])
                    }
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      ) : locked ? (
        <Text style={styles.meta}>Not submitted</Text>
      ) : (
        <View style={styles.reqActions}>
          <View style={styles.flex}>
            <Button label="Scan" onPress={() => startScan()} loading={busy} />
          </View>
          <View style={styles.flex}>
            <Button variant="secondary" label="Attach" onPress={promptAttach} disabled={busy} />
          </View>
        </View>
      )}

      <ScanPreview
        pages={pages}
        title={requirement.label}
        onChange={setPages}
        onAddPages={pages && pages.length < MAX_SCAN_PAGES ? addPages : undefined}
        onRetake={() => {
          setPages(null);
          afterSheetCloses(() => startScan());
        }}
        onCancel={() => setPages(null)}
        onConfirm={(file) => {
          setPages(null);
          save(file);
        }}
      />
    </View>
  );
}
