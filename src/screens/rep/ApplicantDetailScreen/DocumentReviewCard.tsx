import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { TextField } from '@/components/TextField';
import type { ApplicationDocument } from '@/features/applications/api';
import {
  REVIEW_STATUS_LABELS,
  reviewStatusColor,
  type ReviewStatus,
} from '@/features/applications/status';
import { useTheme } from '@/hooks/useTheme';
import { signedUrl } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createRepStyles } from '../repStyles';

type DocumentReviewCardProps = {
  document: ApplicationDocument;
  locked: boolean;
  onReview: (status: ReviewStatus, notes: string | null) => Promise<void>;
};

/** SDD screen 22 — open a submitted file and approve, reject or request a resubmission. */
export function DocumentReviewCard({ document, locked, onReview }: DocumentReviewCardProps) {
  const { colors } = useTheme();
  const styles = createRepStyles(colors);
  const [noteMode, setNoteMode] = useState<'resubmit' | 'rejected' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function open() {
    try {
      await WebBrowser.openBrowserAsync(await signedUrl('documents', document.storage_path));
    } catch (e) {
      Alert.alert('Could not open file', getErrorMessage(e));
    }
  }

  async function review(status: ReviewStatus, notes: string | null) {
    setBusy(true);
    try {
      await onReview(status, notes);
      setNoteMode(null);
      setNote('');
    } catch (e) {
      Alert.alert('Could not save review', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={styles.rowBetween}>
        <Text style={[styles.cardTitle, styles.flex]}>{document.label}</Text>
        <StatusBadge
          label={REVIEW_STATUS_LABELS[document.review_status]}
          color={reviewStatusColor(document.review_status, colors)}
        />
      </View>
      <Text style={styles.meta}>
        {document.mime_type === 'application/pdf' ? 'PDF' : 'Image'} ·{' '}
        {(document.size_bytes / 1024 / 1024).toFixed(2)} MB · uploaded{' '}
        {new Date(document.updated_at).toLocaleDateString()}
      </Text>
      {document.review_notes ? (
        <Text style={styles.meta}>Note: {document.review_notes}</Text>
      ) : null}

      <Button variant="secondary" label="Open file" onPress={open} />

      {!locked && noteMode === null ? (
        <View style={styles.actions}>
          <View style={styles.action}>
            <Button
              label="Approve"
              onPress={() => review('approved', null)}
              loading={busy}
              disabled={document.review_status === 'approved'}
            />
          </View>
          <View style={styles.action}>
            <Button
              variant="secondary"
              label="Request resubmit"
              onPress={() => setNoteMode('resubmit')}
              disabled={busy}
            />
          </View>
          <View style={styles.action}>
            <Button variant="link" label="Reject" onPress={() => setNoteMode('rejected')} />
          </View>
        </View>
      ) : null}

      {noteMode ? (
        <View style={styles.section}>
          <TextField
            label={noteMode === 'resubmit' ? 'What should the student fix?' : 'Reason (optional)'}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={1000}
          />
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button
                label={noteMode === 'resubmit' ? 'Send request' : 'Reject document'}
                loading={busy}
                disabled={noteMode === 'resubmit' && !note.trim()}
                onPress={() => review(noteMode, note.trim() || null)}
              />
            </View>
            <View style={styles.action}>
              <Button variant="secondary" label="Cancel" onPress={() => setNoteMode(null)} />
            </View>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
