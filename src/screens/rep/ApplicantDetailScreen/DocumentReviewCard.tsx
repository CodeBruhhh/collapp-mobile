import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AiDocumentCheck } from '@/components/AiDocumentCheck';
import { Button } from '@/components/Button';
import { ImageViewer } from '@/components/ImageViewer';
import { StatusBadge } from '@/components/StatusBadge';
import { TextField } from '@/components/TextField';
import type { DocumentCheck } from '@/features/ai/api';
import type { ApplicationDocument } from '@/features/applications/api';
import {
  REVIEW_STATUS_LABELS,
  reviewStatusColor,
  type ReviewStatus,
} from '@/features/applications/status';
import {
  fillTemplate,
  templatesFor,
  type MessageTemplate,
  type TemplateValues,
} from '@/features/rep/templates';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { signedUrl } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createScreenStyles } from '@/screens/screenStyles';

const SIGNED_URL_STALE_MS = 8 * 60 * 1000;

type DocumentReviewCardProps = {
  document: ApplicationDocument;
  locked: boolean;
  onReview: (status: ReviewStatus, notes: string | null) => Promise<void>;
  aiCheck?: DocumentCheck;
  aiAwaiting?: boolean;
  onRecheck?: () => void;
  rechecking?: boolean;
  /** Saved templates; resubmission ones are offered when writing a request. */
  templates?: MessageTemplate[];
  /** Student, program and college for filling templates (the document is added here). */
  templateValues?: TemplateValues;
};

/** SDD screen 22 — open a submitted file and approve, reject or request a resubmission. */
export function DocumentReviewCard({
  document,
  locked,
  onReview,
  aiCheck,
  aiAwaiting,
  onRecheck,
  rechecking,
  templates = [],
  templateValues = {},
}: DocumentReviewCardProps) {
  const { colors } = useTheme();
  const styles = createScreenStyles(colors);
  const [noteMode, setNoteMode] = useState<'resubmit' | 'rejected' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [viewing, setViewing] = useState(false);
  const isImage = document.mime_type.startsWith('image/');
  // Short-lived link, fetched once per card and never written to disk.
  const link = useQuery({
    queryKey: ['signed-url', 'documents', document.storage_path],
    queryFn: () => signedUrl('documents', document.storage_path, 600),
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_STALE_MS,
    enabled: isImage,
    meta: { persist: false },
  });

  /** Photos open in the in-app viewer; PDFs in an in-app browser sheet. */
  async function open() {
    if (isImage) {
      setViewing(true);
      return;
    }
    try {
      await WebBrowser.openBrowserAsync(await signedUrl('documents', document.storage_path), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (e) {
      notify.error('Could not open file', getErrorMessage(e));
    }
  }

  async function review(status: ReviewStatus, notes: string | null) {
    setBusy(true);
    try {
      await onReview(status, notes);
      setNoteMode(null);
      setNote('');
    } catch (e) {
      notify.error('Could not save review', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.document}>
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

      <AiDocumentCheck
        check={aiCheck}
        awaiting={aiAwaiting}
        audience="rep"
        onRecheck={onRecheck}
        rechecking={rechecking}
      />

      {isImage ? (
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={`${document.label}. Tap to view full screen`}
          onPress={open}
          style={styles.docPreview}>
          {link.data ? (
            <Image source={{ uri: link.data }} style={styles.docPreviewImage} contentFit="cover" />
          ) : (
            <ActivityIndicator color={colors.textMuted} />
          )}
        </Pressable>
      ) : (
        <Button variant="secondary" label="Open PDF" onPress={open} />
      )}
      <ImageViewer
        uri={viewing && link.data ? link.data : null}
        title={document.label}
        onClose={() => setViewing(false)}
      />

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
          {noteMode === 'resubmit' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.templateChips}
              accessibilityLabel="Request templates">
              {templatesFor(templates, 'resubmit').map((t) => (
                <Pressable
                  key={t.id ?? t.title}
                  accessibilityRole="button"
                  accessibilityHint="Fills in the request"
                  onPress={() =>
                    setNote(
                      fillTemplate(t.body, { ...templateValues, document: document.label }).slice(
                        0,
                        1000,
                      ),
                    )
                  }
                  style={({ pressed }) => [styles.templateChip, pressed && styles.pressedChip]}>
                  <Text style={styles.templateChipText}>{t.title}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
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
                variant={noteMode === 'rejected' ? 'danger' : 'primary'}
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
    </View>
  );
}
