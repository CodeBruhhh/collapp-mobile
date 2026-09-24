import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { ImagePlaceholder } from '@/components/ImagePlaceholder/ImagePlaceholder';
import { useTheme } from '@/hooks/useTheme';
import type { College } from '@/types/models';
import { formatCompactNumber } from '@/utils/format';

import { createStyles } from './UniversityCard.styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Stat({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={14} color={colors.textMuted} />
      <Text style={styles.statText}>{text}</Text>
    </View>
  );
}

/** Compact horizontal card used in the Home "Popular Universities" list. */
export function UniversityCard({ college }: { college: College }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const city = college.location.split(',')[0];

  return (
    <View style={styles.card}>
      <ImagePlaceholder style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {college.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {college.description}
        </Text>
        <View style={styles.stats}>
          <Stat icon="location-outline" text={city} />
          <Stat icon="school-outline" text={`${college.programs.length} programs`} />
          <Stat icon="people-outline" text={`${formatCompactNumber(college.studentCount)} students`} />
        </View>
      </View>
    </View>
  );
}