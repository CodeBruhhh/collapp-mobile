import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { CollegeLogo } from '@/components/CollegeLogo';
import { ProgressBar } from '@/components/ProgressBar';
import type { Recommendation } from '@/features/ai/api';
import { deadlineLabel } from '@/features/applications/status';
import { collegeLocation } from '@/features/colleges/api';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './MatchCard.styles';

type MatchCardProps = {
  recommendation: Recommendation;
  /** Show the "why" list (recommendations screen) or keep it compact (home). */
  showReasons?: boolean;
};

/** One AI match: college, program, match % and why it matched (SDD screen 8). */
export function MatchCard({ recommendation: r, showReasons }: MatchCardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  if (!r.college || !r.program) return null;
  const score = Math.round(r.match_score);

  return (
    <Card
      onPress={() =>
        router.push({ pathname: '/student/college/[id]', params: { id: r.college!.id } })
      }
      accessibilityLabel={`${r.program.name} at ${r.college.name}, ${score}% match`}>
      <View style={styles.row}>
        <CollegeLogo name={r.college.name} logoPath={r.college.logo_path} size={48} />
        <View style={styles.flex}>
          <Text style={styles.college} numberOfLines={1}>
            {r.college.name}
          </Text>
          <Text style={styles.program} numberOfLines={2}>
            {r.program.name}
          </Text>
          <Text style={styles.meta}>{collegeLocation(r.college)}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>Match</Text>
        <View style={styles.flex}>
          <ProgressBar value={score / 100} accessibilityLabel="Match score" />
        </View>
        <Text style={styles.score}>{score}%</Text>
      </View>
      {showReasons && r.reasons.length ? (
        <View style={styles.reasons}>
          {r.reasons.map((reason) => (
            <Text key={reason} style={styles.reason}>
              {'✓ '}
              {reason}
            </Text>
          ))}
        </View>
      ) : null}
      {r.program.deadline ? (
        <Text style={styles.meta}>
          Deadline {r.program.deadline} · {deadlineLabel(r.program.deadline)}
        </Text>
      ) : null}
    </Card>
  );
}
