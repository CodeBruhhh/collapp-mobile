import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CollegeLogo } from '@/components/CollegeLogo';
import { DeadlineMark } from '@/components/DeadlineMark';
import { Icon } from '@/components/Icon';
import { TickMeter } from '@/components/TickMeter';
import type { Recommendation } from '@/features/ai/api';
import { collegeLocation } from '@/features/colleges/api';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './MatchCard.styles';

type MatchCardProps = {
  recommendation: Recommendation;
  /** Show the "why" list (recommendations screen) or keep it compact (home). */
  showReasons?: boolean;
  /** Position in a ranked list. */
  rank?: number;
};

/** One AI match: college, program, match % and why it matched (SDD screen 8). */
export function MatchCard({ recommendation: r, showReasons, rank }: MatchCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  if (!r.college || !r.program) return null;
  const score = Math.round(r.match_score);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.program.name} at ${r.college.name}, ${score}% match`}
      onPress={() =>
        router.push({ pathname: '/student/college/[id]', params: { id: r.college!.id } })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <CollegeLogo name={r.college.name} logoPath={r.college.logo_path} size={40} />
        <View style={styles.flex}>
          {rank ? <Text style={styles.rank}>No. {rank}</Text> : null}
          <Text style={styles.program} numberOfLines={2}>
            {r.program.name}
          </Text>
          <Text style={styles.college} numberOfLines={1}>
            {r.college.name}
          </Text>
          <Text style={styles.meta}>{collegeLocation(r.college)}</Text>
        </View>
        <Text style={styles.score}>{score}%</Text>
      </View>
      <TickMeter value={score} label="Match score" />
      {showReasons && r.reasons.length ? (
        <View style={styles.reasons}>
          {r.reasons.map((reason) => (
            <View key={reason} style={styles.reason}>
              <Icon name="checkmark" size={14} color={colors.primary} />
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <DeadlineMark date={r.program.deadline} showDate />
    </Pressable>
  );
}
