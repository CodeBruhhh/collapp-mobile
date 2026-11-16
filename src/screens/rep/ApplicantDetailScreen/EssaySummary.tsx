import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AiUsageMeter } from '@/components/AiUsageMeter';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import type { PromptFit } from '@/features/ai/api';
import { useAiAllowance, useEssayReview, useRegenerateEssayReview } from '@/features/ai/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';
import { radius, spacing, type, type ThemeColors } from '@/styles';

const FIT_TEXT: Record<PromptFit, string> = {
  strong: 'Answers the prompt well',
  partial: 'Partly answers the prompt',
  weak: 'Does not really answer the prompt',
  no_prompt: 'No prompt set for this program',
};

/** Advisory AI summary of a submitted essay, shown above the full text. */
export function EssaySummary({ applicationId }: { applicationId: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const review = useEssayReview(applicationId);
  const regenerate = useRegenerateEssayReview(applicationId);
  // Summaries a rep asks for count against their daily limit.
  const allowance = useAiAllowance('essay_summary');
  const blocked = allowance.exhausted || allowance.paused;
  const r = review.data;

  const run = () =>
    regenerate.mutateAsync().catch((e) => notify.error('No summary yet', getErrorMessage(e)));

  if (review.isPending) return null;

  if (!r || r.status !== 'done') {
    const pending = r?.status === 'pending' || regenerate.isPending;
    return (
      <View style={styles.panel}>
        <View style={styles.row}>
          {pending ? (
            <ActivityIndicator size="small" color={colors.textMuted} />
          ) : (
            <Icon name="sparkles" size={16} color={colors.textMuted} />
          )}
          <Text style={[styles.muted, styles.flex]}>
            {pending
              ? 'AI is summarizing this essay…'
              : (r?.error ?? 'No AI summary for this essay yet.')}
          </Text>
        </View>
        {!pending ? (
          <>
            <Button variant="link" label="Summarize with AI" onPress={run} disabled={blocked} />
            <AiUsageMeter kind="essay_summary" />
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Icon name="sparkles" size={16} color={colors.primary} />
        <Text style={[styles.label, styles.flex]}>AI summary</Text>
        {r.word_count !== null ? <Text style={styles.muted}>{r.word_count} words</Text> : null}
      </View>
      {r.summary ? <Text style={styles.text}>{r.summary}</Text> : null}
      {r.key_points.length ? (
        <View style={styles.group}>
          {r.key_points.map((p) => (
            <View key={p} style={styles.row}>
              <Icon name="ellipse" size={6} color={colors.textMuted} style={styles.bullet} />
              <Text style={[styles.text, styles.flex]}>{p}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {r.prompt_fit && r.prompt_fit !== 'no_prompt' ? (
        <Text style={styles.muted}>
          {FIT_TEXT[r.prompt_fit]}
          {r.prompt_fit_note ? `: ${r.prompt_fit_note}` : ''}
        </Text>
      ) : null}
      <View style={styles.row}>
        <Text style={[styles.disclaimer, styles.flex]}>
          Advisory AI summary, may be wrong. Read the full essay below.
        </Text>
        <Button
          variant="link"
          label="Regenerate"
          onPress={run}
          loading={regenerate.isPending}
          disabled={blocked}
        />
      </View>
      <AiUsageMeter kind="essay_summary" />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    panel: {
      gap: spacing.sm,
      padding: spacing.md,
      marginTop: spacing.sm,
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      backgroundColor: c.surfaceMuted,
    },
    flex: { flex: 1 },
    group: { gap: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    bullet: { alignSelf: 'flex-start', marginTop: 7 },
    label: { ...type.label, color: c.text },
    text: { ...type.caption, color: c.text },
    muted: { ...type.caption, color: c.textMuted },
    disclaimer: { ...type.caption, fontSize: 11, color: c.textMuted },
  });
