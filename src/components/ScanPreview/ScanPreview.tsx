import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';
import { pagesToPdf } from '@/lib/pdf';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ScanPreview.styles';

type ScanPreviewProps = {
  /** The scanned pages, in order; the modal is hidden while null. */
  pages: LocalFile[] | null;
  title: string;
  /** The pages after one was rotated or removed. */
  onChange: (pages: LocalFile[]) => void;
  /** Scan more pages onto the end; leave out when no more pages fit. */
  onAddPages?: () => void;
  onRetake: () => void;
  onCancel: () => void;
  /** One page arrives as a JPEG; several arrive combined into one PDF. */
  onConfirm: (file: LocalFile) => void;
};

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

/** SDD screen 10 — check each scanned page, rotate or remove it, then attach the scan. */
export function ScanPreview({
  pages,
  title,
  onChange,
  onAddPages,
  onRetake,
  onCancel,
  onConfirm,
}: ScanPreviewProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState<'rotate' | 'combine' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const count = pages?.length ?? 0;
  const index = Math.min(selected, Math.max(0, count - 1));
  const current = pages?.[index] ?? null;
  const totalBytes = pages?.reduce((sum, p) => sum + p.size, 0) ?? 0;

  async function rotate() {
    if (!pages || !current) return;
    setBusy('rotate');
    setError(null);
    try {
      const context = ImageManipulator.manipulate(current.uri);
      context.rotate(90);
      const image = await context.renderAsync();
      const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
      image.release();
      const turned = { ...current, uri: saved.uri, size: new File(saved.uri).size };
      onChange(pages.map((p, i) => (i === index ? turned : p)));
    } catch (e) {
      setError(`Could not rotate. ${getErrorMessage(e)}`);
    } finally {
      setBusy(null);
    }
  }

  function removePage() {
    if (!pages || count < 2) return;
    setError(null);
    onChange(pages.filter((_, i) => i !== index));
    setSelected(Math.max(0, index - 1));
  }

  async function confirm() {
    if (!pages || !current) return;
    if (count === 1) {
      close(() => onConfirm(current));
      return;
    }
    setBusy('combine');
    setError(null);
    try {
      const pdf = await pagesToPdf(pages, `${title}.pdf`);
      close(() => onConfirm(pdf));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  function close(action: () => void) {
    setSelected(0);
    setError(null);
    action();
  }

  return (
    <Modal visible={pages !== null} animationType="slide" onRequestClose={() => close(onCancel)}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {count > 1 ? (
            <Text style={styles.pageCount} accessibilityLiveRegion="polite">
              Page {index + 1} of {count}
            </Text>
          ) : null}
        </View>

        {current ? (
          <Image
            source={{ uri: current.uri }}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel={
              count > 1 ? `Scanned page ${index + 1} of ${count}` : 'Scanned document preview'
            }
          />
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}>
          {pages?.map((page, i) => (
            <Pressable
              key={page.uri}
              accessibilityRole="button"
              accessibilityLabel={`Page ${i + 1}`}
              accessibilityState={{ selected: i === index }}
              onPress={() => setSelected(i)}
              style={[styles.thumb, i === index && styles.thumbSelected]}>
              <Image source={{ uri: page.uri }} style={styles.thumbImage} contentFit="cover" />
              <Text style={styles.thumbNumber}>{i + 1}</Text>
            </Pressable>
          ))}
          {onAddPages ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan more pages"
              disabled={busy !== null}
              onPress={onAddPages}
              style={[styles.thumb, styles.addPage]}>
              <Icon name="add-circle" size={22} color={colors.primary} />
              <Text style={styles.addPageLabel}>Add page</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <View style={styles.metaRow}>
          <Icon name="document" size={14} color={colors.textMuted} />
          <Text style={styles.meta}>
            {count > 1
              ? `${count} pages · ${megabytes(totalBytes)} · sent as one PDF`
              : `${megabytes(totalBytes)} · JPEG`}
          </Text>
        </View>
        {error ? (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label="Rotate"
              onPress={rotate}
              loading={busy === 'rotate'}
              disabled={busy !== null}
            />
          </View>
          {count > 1 ? (
            <View style={styles.flex}>
              <Button
                variant="secondary"
                label="Remove page"
                onPress={removePage}
                disabled={busy !== null}
              />
            </View>
          ) : null}
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label={count > 1 ? 'Retake all' : 'Retake'}
              onPress={() => close(onRetake)}
              disabled={busy !== null}
            />
          </View>
        </View>
        <Button
          label={count > 1 ? `Use ${count} pages` : 'Use this scan'}
          onPress={confirm}
          loading={busy === 'combine'}
          disabled={busy !== null || !current}
        />
        <Button variant="link" label="Cancel" onPress={() => close(onCancel)} />
      </SafeAreaView>
    </Modal>
  );
}
