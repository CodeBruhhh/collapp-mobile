import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import type { ApplicationDocument } from '@/features/applications/api';
import { REVIEW_STATUS_LABELS, reviewStatusColor } from '@/features/applications/status';
import type { Requirement } from '@/features/colleges/api';
import { useTheme } from '@/hooks/useTheme';
import { pickDocumentFile, pickPhoto } from '@/lib/pickers';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ApplyScreen.styles';

type RequirementUploadProps = {
  requirement: Requirement;
  document: ApplicationDocument | undefined;
  busy: boolean;
  /** Hide remove/replace once a document is approved or the application is locked. */
  locked?: boolean;
  onUpload: (file: LocalFile) => Promise<void>;
  onRemove?: () => Promise<void>;
};

/** One document requirement: shows what's uploaded and lets the student add or replace it. */
export function RequirementUpload({
  requirement,
  document,
  busy,
  locked,
  onUpload,
  onRemove,
}: RequirementUploadProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const canChange = !locked && document?.review_status !== 'approved';

  async function choose(source: 'file' | 'camera' | 'library') {
    try {
      const file = source === 'file' ? await pickDocumentFile() : await pickPhoto(source);
      if (file) await onUpload(file);
    } catch (e) {
      Alert.alert('Upload failed', getErrorMessage(e));
    }
  }

  function promptSource() {
    Alert.alert(requirement.label, 'Add a PDF or a photo of the document.', [
      { text: 'Take photo', onPress: () => choose('camera') },
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
          <StatusBadge
            label={REVIEW_STATUS_LABELS[document.review_status]}
            color={reviewStatusColor(document.review_status, colors)}
          />
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
                        { text: 'Remove', style: 'destructive', onPress: () => onRemove() },
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
        <Button variant="secondary" label="Add document" onPress={promptSource} loading={busy} />
      )}
    </Card>
  );
}
