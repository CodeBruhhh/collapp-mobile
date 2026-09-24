import { Text, View } from 'react-native';

import { DeadlineCountdown } from '@/components/DeadlineCountdown';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { STATUS_META } from '@/constants/applicationStatus';
import { useTheme } from '@/hooks/useTheme';
import type { ApplicationView } from '@/types/models';
import { formatDate } from '@/utils/dates';

import { createStyles } from './ApplicationCard.styles';

export function ApplicationCard({ application }: { application: ApplicationView }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { college, program, status, submittedAt } = application;
  const meta = STATUS_META[status];
  // A deadline only matters while the student still has something to do.
  const deadlineMatters = status === 'draft' || status === 'action_required';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titles}>
          <Text style={styles.college}>{college.name}</Text>
          <Text style={styles.program}>{program.name}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      <ProgressBar
        value={meta.progress}
        color={colors.status[meta.colorKey]}
        label={`${college.name} application progress`}
      />

      {deadlineMatters ? (
        <DeadlineCountdown deadline={program.deadline} />
      ) : (
        <Text style={styles.meta}>
          {submittedAt ? `Submitted ${formatDate(submittedAt)}` : 'Not submitted'}
        </Text>
      )}
    </View>
  );
}
