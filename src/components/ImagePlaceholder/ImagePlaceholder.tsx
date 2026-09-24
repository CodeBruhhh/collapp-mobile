import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ImagePlaceholder.styles';

/**
 * Stand-in for a photo. Give it a size through `style`. Swap for expo-image's
 * <Image source={{ uri }} /> once colleges have real pictures.
 */
export function ImagePlaceholder({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, style]}>
      <Ionicons name="image-outline" size={28} color={colors.textMuted} />
    </View>
  );
}