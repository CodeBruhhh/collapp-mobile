import { Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import type { AiKind } from '@/features/ai/api';
import { useAiAllowance, useMyAiUsage } from '@/features/ai/hooks';
import { AI_KIND_LABELS, resetTimeLabel } from '@/features/ai/limits';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './AiUsageMeter.styles';

/** Bar color: calm while there is room, amber near the end, red when used up. */
function meterColor(left: number, limit: number, c: ReturnType<typeof useTheme>['colors']) {
  if (left === 0) return c.danger;
  if (left / limit <= 0.2) return c.status.underReview;
  return c.primary;
}

/**
 * "12 of 30 re-checks left today" with a thin bar, shown beside an AI button.
 * Renders nothing for unlimited users (administrators) or while loading.
 */
export function AiUsageMeter({ kind }: { kind: AiKind }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { limit, left, used, paused, resetsAt } = useAiAllowance(kind);

  if (paused) {
    return (
      <View style={styles.compact} accessibilityLiveRegion="polite">
        <Text style={styles.caption}>AI is paused by a CollApp administrator.</Text>
      </View>
    );
  }
  if (limit === null || left === null) return null;

  const unit = AI_KIND_LABELS[kind].unit;
  const text =
    left === 0
      ? `Daily limit reached (${limit} ${unit}). More at ${resetTimeLabel(resetsAt)}.`
      : `${left} of ${limit} ${unit} left today`;

  return (
    <View style={styles.compact} accessible accessibilityLabel={text}>
      <Text style={[styles.caption, left === 0 && { color: colors.danger }]}>{text}</Text>
      <ProgressBar value={limit ? used / limit : 1} color={meterColor(left, limit, colors)} />
    </View>
  );
}

/** Every daily AI limit that applies to the signed-in person (Profile & Settings). */
export function AiUsageList() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const usage = useMyAiUsage();
  const data = usage.data;
  const items = (data?.items ?? []).filter((i) => i.limit !== null && i.limit > 0);

  if (!data || !items.length) return null;

  return (
    <View style={styles.list}>
      {data.enabled ? null : (
        <View style={styles.paused}>
          <Icon name="alert-circle" size={16} color={colors.status.underReview} />
          <Text style={styles.caption}>
            AI is paused by a CollApp administrator. Your limits still reset as usual.
          </Text>
        </View>
      )}
      {items.map((item) => {
        const limit = item.limit ?? 0;
        const left = Math.max(0, limit - item.used);
        const meta = AI_KIND_LABELS[item.kind];
        return (
          <View
            key={item.kind}
            style={styles.row}
            accessible
            accessibilityLabel={`${meta.label}: ${item.used} of ${limit} used today, ${left} left`}>
            <View style={styles.rowHead}>
              <Text style={styles.label}>{meta.label}</Text>
              <Text style={[styles.count, left === 0 && { color: colors.danger }]}>
                {item.used} / {limit}
              </Text>
            </View>
            <ProgressBar value={item.used / limit} color={meterColor(left, limit, colors)} />
            <Text style={styles.caption}>
              {left === 0 ? 'Used up for today. ' : `${left} left. `}
              {meta.hint}.
            </Text>
          </View>
        );
      })}
      <Text style={styles.caption}>
        Limits reset at {resetTimeLabel(data.resets_at)} (midnight Philippine time). A request that
        fails does not count.
      </Text>
    </View>
  );
}
