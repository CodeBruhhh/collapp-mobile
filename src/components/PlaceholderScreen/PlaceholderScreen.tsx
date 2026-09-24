import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './PlaceholderScreen.styles';

type PlaceholderScreenProps = {
  title: string;
  description: string;
  /** What this screen will contain, taken from the SRS/SDD. */
  features: string[];
};

/** Temporary body for screens that are not built yet. Delete as each one is implemented. */
export function PlaceholderScreen({ title, description, features }: PlaceholderScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>Planned for this screen</Text>
        {features.map((feature) => (
          <Text key={feature} style={styles.feature}>
            {'\u2022'} {feature}
          </Text>
        ))}
      </View>
    </Screen>
  );
}
