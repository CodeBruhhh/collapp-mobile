import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ImagePlaceholder } from '@/components/ImagePlaceholder/ImagePlaceholder';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './FeaturedCard.styles';

type FeaturedCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  onActionPress: () => void;
};

export function FeaturedCard({
  eyebrow,
  title,
  description,
  actionLabel,
  onActionPress,
}: FeaturedCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <ImagePlaceholder style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onActionPress} />
        </View>
      </View>
    </View>
  );
}