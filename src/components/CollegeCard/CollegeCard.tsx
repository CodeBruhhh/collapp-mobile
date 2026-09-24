import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import type { College } from '@/types/models';

import { createStyles } from './CollegeCard.styles';

type CollegeCardProps = {
  college: College;
  /** 0-100; hidden when omitted. */
  matchScore?: number;
};

export function CollegeCard({ college, matchScore }: CollegeCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{college.name}</Text>
        {matchScore !== undefined ? (
          <Text style={styles.match} accessibilityLabel={`${matchScore} percent match`}>
            {matchScore}% match
          </Text>
        ) : null}
      </View>

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
        <Text style={styles.location}>{college.location}</Text>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {college.description}
      </Text>

      <Text style={styles.programs} numberOfLines={1}>
        {college.programs.map((p) => p.name).join(' \u00B7 ')}
      </Text>
    </View>
  );
}
