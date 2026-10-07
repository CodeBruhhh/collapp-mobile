import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { publicUrl } from '@/lib/storage';

import { createStyles } from './CollegeLogo.styles';

type CollegeLogoProps = {
  name: string;
  logoPath: string | null | undefined;
  size?: number;
};

/** College logo from the public media bucket, falling back to initials. */
export function CollegeLogo({ name, logoPath, size = 48 }: CollegeLogoProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const uri = publicUrl('college-media', logoPath);
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  const box = { width: size, height: size, borderRadius: size / 4 };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, box]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  return (
    <View style={[styles.fallback, box]} accessible={false}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials || '?'}</Text>
    </View>
  );
}
