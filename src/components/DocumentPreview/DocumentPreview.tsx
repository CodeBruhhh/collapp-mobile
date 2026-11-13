import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ImageViewer } from '@/components/ImageViewer';
import type { DisplayDocument } from '@/features/applications/offline';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { signedUrl } from '@/lib/storage';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './DocumentPreview.styles';

const LINK_SECONDS = 600;
const LINK_STALE_MS = 8 * 60 * 1000;

/** A student's own file: a tappable photo, or a button that opens the PDF. */
export function DocumentPreview({ document }: { document: DisplayDocument }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [viewing, setViewing] = useState(false);
  const isImage = document.mime_type.startsWith('image/');
  // A queued file is still on this device, and is newer than any server copy it replaces.
  const localUri = document.pending?.uri ?? null;
  const storagePath = localUri ? null : (document.server?.storage_path ?? null);

  // Short-lived link, never written to disk.
  const link = useQuery({
    queryKey: ['signed-url', 'documents', storagePath],
    queryFn: () => signedUrl('documents', storagePath!, LINK_SECONDS),
    staleTime: LINK_STALE_MS,
    gcTime: LINK_STALE_MS,
    enabled: isImage && Boolean(storagePath),
    meta: { persist: false },
  });

  async function openPdf() {
    try {
      await WebBrowser.openBrowserAsync(await signedUrl('documents', storagePath!), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (e) {
      notify.error('Could not open file', getErrorMessage(e));
    }
  }

  if (!isImage) {
    // A queued PDF can't open in the browser sheet until it has uploaded.
    return storagePath ? <Button variant="secondary" label="View PDF" onPress={openPdf} /> : null;
  }

  const uri = localUri ?? link.data ?? null;
  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel={`${document.label}. Tap to view full screen`}
        accessibilityState={{ disabled: !uri }}
        disabled={!uri && !link.isError}
        onPress={() => (uri ? setViewing(true) : link.refetch())}
        style={styles.preview}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        ) : link.isError ? (
          <Text style={styles.status}>Could not load this file. Tap to try again.</Text>
        ) : (
          <ActivityIndicator color={colors.textMuted} />
        )}
      </Pressable>
      <ImageViewer
        uri={viewing ? uri : null}
        title={document.label}
        onClose={() => setViewing(false)}
      />
    </>
  );
}
