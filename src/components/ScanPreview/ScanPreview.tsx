import Ionicons from '@expo/vector-icons/Ionicons';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useState } from 'react';
import { Alert, Modal, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import type { LocalFile } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ScanPreview.styles';

type ScanPreviewProps = {
  /** The scan to review; the modal is hidden while null. */
  file: LocalFile | null;
  title: string;
  onRetake: () => void;
  onCancel: () => void;
  onConfirm: (file: LocalFile) => void;
};

/** SDD screen 10 — check a scan, rotate it if needed, then attach it. */
export function ScanPreview({ file, title, onRetake, onCancel, onConfirm }: ScanPreviewProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [rotated, setRotated] = useState<LocalFile | null>(null);
  const [busy, setBusy] = useState(false);
  const current = rotated ?? file;

  async function rotate() {
    if (!current) return;
    setBusy(true);
    try {
      const context = ImageManipulator.manipulate(current.uri);
      context.rotate(90);
      const image = await context.renderAsync();
      const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
      setRotated({ ...current, uri: saved.uri, size: new File(saved.uri).size });
    } catch (e) {
      Alert.alert('Could not rotate', getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function close(action: () => void) {
    setRotated(null);
    action();
  }

  return (
    <Modal visible={Boolean(file)} animationType="slide" onRequestClose={() => close(onCancel)}>
      <SafeAreaView style={styles.root}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {current ? (
          <>
            <Image
              source={{ uri: current.uri }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel="Scanned document preview"
            />
            <Text style={styles.meta}>
              <Ionicons name="document-outline" size={14} />{' '}
              {(current.size / 1024 / 1024).toFixed(2)} MB · JPEG
            </Text>
          </>
        ) : null}
        <View style={styles.actions}>
          <View style={styles.flex}>
            <Button variant="secondary" label="Rotate" onPress={rotate} loading={busy} />
          </View>
          <View style={styles.flex}>
            <Button
              variant="secondary"
              label="Retake"
              onPress={() => close(onRetake)}
              disabled={busy}
            />
          </View>
        </View>
        <Button
          label="Use this scan"
          onPress={() => current && close(() => onConfirm(current))}
          disabled={busy || !current}
        />
        <Button variant="link" label="Cancel" onPress={() => close(onCancel)} />
      </SafeAreaView>
    </Modal>
  );
}
