import { Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Stepper.styles';

type StepperProps = {
  steps: readonly string[];
  /** Zero-based index of the current step. */
  current: number;
  /** Name the current step in the caption (when no heading already does). */
  named?: boolean;
};

/** Numbered progress through a multi-step form, with the current step named underneath. */
export function Stepper({ steps, current, named }: StepperProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${steps.length}: ${steps[current]}`}
      accessibilityValue={{ min: 0, max: steps.length, now: current + 1 }}>
      <View style={styles.track}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <View key={step} style={[styles.item, index === steps.length - 1 && styles.itemLast]}>
              <View style={[styles.mark, done && styles.markDone, active && styles.markActive]}>
                {done ? (
                  <Icon name="checkmark" size={13} color={colors.onPrimary} />
                ) : (
                  <Text style={[styles.number, active && styles.numberActive]}>{index + 1}</Text>
                )}
              </View>
              {index < steps.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={styles.caption}>
        Step {current + 1} of {steps.length}
        {named ? ` · ${steps[current]}` : ''}
      </Text>
    </View>
  );
}
