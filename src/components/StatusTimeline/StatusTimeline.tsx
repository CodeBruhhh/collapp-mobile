import { Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './StatusTimeline.styles';
import type { TimelineStep } from './timeline';

export { applicationTimeline } from './timeline';

const STATE_LABEL = {
  done: 'done',
  current: 'current step',
  alert: 'needs your attention',
  upcoming: 'not reached yet',
} as const;

function shortDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Vertical milestone track; replaces a bare progress bar with where things actually stand. */
export function StatusTimeline({ steps }: { steps: TimelineStep[] }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View accessibilityRole="list">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const reached = step.state !== 'upcoming';
        return (
          <View
            key={step.key}
            style={styles.step}
            accessible
            accessibilityLabel={`${step.label}, ${STATE_LABEL[step.state]}${step.date ? `, ${shortDate(step.date)}` : ''}`}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.mark,
                  step.state === 'done' && styles.markDone,
                  step.state === 'current' && styles.markCurrent,
                  step.state === 'alert' && styles.markAlert,
                ]}>
                {step.state === 'done' ? (
                  <Icon name="checkmark" size={13} color={colors.onPrimary} />
                ) : step.state === 'alert' ? (
                  <Text style={styles.markText}>!</Text>
                ) : null}
              </View>
              {last ? null : (
                <View style={[styles.line, step.state === 'done' && styles.lineDone]} />
              )}
            </View>
            <View style={[styles.body, last && styles.bodyLast]}>
              <Text
                style={[
                  styles.label,
                  !reached && styles.labelUpcoming,
                  step.state === 'current' && styles.labelCurrent,
                  step.state === 'alert' && styles.labelAlert,
                ]}>
                {step.label}
              </Text>
              {step.date ? <Text style={styles.date}>{shortDate(step.date)}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
