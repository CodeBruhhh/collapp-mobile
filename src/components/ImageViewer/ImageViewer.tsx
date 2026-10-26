import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { createStyles } from './ImageViewer.styles';

type ImageViewerProps = {
  /** Image to show; the viewer is open while this is set. */
  uri: string | null;
  title?: string | null;
  onClose: () => void;
};

/**
 * Full-screen, in-app photo viewer (chat photos, scanned documents). Pinch to
 * zoom on iOS; the hardware back button closes it on Android.
 */
export function ImageViewer({ uri, title, onClose }: ImageViewerProps) {
  const styles = createStyles();

  return (
    <Modal
      visible={uri !== null}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent>
      <StatusBar style="light" />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.zoom}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="contain"
              accessibilityLabel={title ?? 'Photo'}
            />
          ) : null}
        </ScrollView>
        <SafeAreaView style={styles.bar} edges={['top']}>
          <Text style={styles.title} numberOfLines={1}>
            {title ?? ''}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            onPress={onClose}
            hitSlop={8}
            style={styles.close}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
