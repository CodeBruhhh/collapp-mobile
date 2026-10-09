import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScanPreview } from '@/components/ScanPreview';
import { StatusBadge } from '@/components/StatusBadge';
import type { DisplayDocument } from '@/features/applications/offline';
import { REVIEW_STATUS_LABELS, reviewStatusColor } from '@/features/applications/status';
import type { Requirement } from '@/features/colleges/api';
import { useTheme } from '@/hooks/useTheme';
import { pickDocumentFile, pickPhoto } from '@/lib/pickers';
import { scanDocument } from '@/lib/scanner';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ApplyScreen.styles';

type RequirementUploadProps = {
  requirement: Requirement;
  document: DisplayDocument | undefined;
  /** Hide replace/remove once the application is locked for this requirement. */
  locked?: boolean;
  onUpload: (file: LocalFile) => Promise<void>;
  onRemove?: () => Promise<void>;
};

/** One document requirement: scan, photograph or pick a file; works offline (SRS 3.1.1.3-4). */
export function RequirementUpload({
  requirement,
  document,
  locked,
  onUpload,
  onRemove,
}: RequirementUploadProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [scan, setScan] = useState<LocalFile | null>(null);
  const [busy, setBusy] = useState(false);
  const canChange = !locked && document?.review_status !== 'approved';

  async function save(file: LocalFile) {
    setBusy(true);
    try {
      await onUpload(file);
    } catch (e) {
      Alert.alert('Could not save the file', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function startScan() {
    try {
      const file = await scanDocument(`${requirement.label}.jpg`);
      if (file) setScan(file);
    } catch (e) {
      Alert.alert('Scanner unavailable', getErrorMessage(e));
    }
  }

  async function choose(source: 'file' | 'library') {
    try {
      const file = source === 'file' ? await pickDocumentFile() : await pickPhoto('library');
      if (file) await save(file);
    } catch (e) {
      Alert.alert('Could not add the file', getErrorMessage(e));
    }
  }

  function promptSource() {
    Alert.alert(requirement.label, 'Scan it with your camera, or attach a photo or PDF.', [
      { text: 'Scan document', onPress: startScan },
      { text: 'Choose photo', onPress: () => choose('library') },
      { text: 'Choose PDF or file', onPress: () => choose('file') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <Card>
      <View style={styles.reqHeader}>
        <Ionicons
          name={document ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={document ? colors.status.accepted : colors.textMuted}
          accessibilityElementsHidden
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
            <Text style={styles.meta}>Uploads automatically when you&apos;re online.</Text>
          ) : null}
          {document.review_notes ? (
            <Text style={styles.note}>Note from the college: {document.review_notes}</Text>
          ) : null}
          <Text style={styles.meta}>
            {document.mime_type === 'application/pdf' ? 'PDF' : 'Image'} ·{' '}
            {(document.size_bytes / 1024 / 1024).toFixed(2)} MB
          </Text>
          {canChange ? (
            <View style={styles.reqActions}>
              <View style={styles.flex}>
                <Button variant="secondary" label="Replace" onPress={promptSource} loading={busy} />
              </View>
              {onRemove ? (
                <View style={styles.flex}>
                  <Button
                    variant="link"
                    label="Remove"
                    disabled={busy}
                    onPress={() =>
                      Alert.alert('Remove this file?', requirement.label, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          style: 'destructive',
                          onPress: () =>
                            onRemove().catch((e) =>
                              Alert.alert('Could not remove', getErrorMessage(e)),
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
            <Button label="Scan" onPress={startScan} loading={busy} />
          </View>
          <View style={styles.flex}>
            <Button variant="secondary" label="Attach" onPress={promptSource} disabled={busy} />
          </View>
        </View>
      )}

      <ScanPreview
        file={scan}
        title={requirement.label}
        onRetake={() => {
          setScan(null);
          startScan();
        }}
        onCancel={() => setScan(null)}
        onConfirm={(file) => {
          setScan(null);
          save(file);
        }}
      />
    </Card>
  );
}
