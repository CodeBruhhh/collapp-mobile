import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import type { EssayFeedback as Feedback, PromptFit } from '@/features/ai/api';
import { useEssayFeedback } from '@/features/ai/hooks';
import { useTheme } from '@/hooks/useTheme';
import { notify } from '@/lib/feedback';
import { getErrorMessage } from '@/lib/validation';
import { fonts, radius, spacing, type, type ThemeColors } from '@/styles';

const MIN_WORDS = 30;

const FIT_TEXT: Record<PromptFit, string> = {
  strong: 'Answers the prompt well',
  partial: 'Partly answers the prompt',
  weak: 'Does not answer the prompt yet',
  no_prompt: 'No prompt given',
};

type EssayFeedbackProps = {
  essay: string;
  prompt: string | null;
  online: boolean;
};

/** AI coaching while drafting the essay (online only; nothing is stored). */
export function EssayFeedback({ essay, prompt, online }: EssayFeedbackProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const feedback = useEssayFeedback();
  const [reviewed, setReviewed] = useState<{ essay: string; result: Feedback } | null>(null);

  const words = essay.trim().split(/\s+/).filter(Boolean).length;
  const outdated = reviewed !== null && reviewed.essay !== essay;

  async function run() {
    try {
      const result = await feedback.mutateAsync({ essay, prompt });
      setReviewed({ essay, result });
    } catch (e) {
      notify.error('No feedback yet', getErrorMessage(e));
    }
  }

  const r = reviewed?.result;
  const fitColor =
    r?.prompt_fit === 'strong'
      ? colors.status.accepted
      : r?.prompt_fit === 'weak'
        ? colors.danger
        : colors.status.underReview;

  return (
    <View style={styles.root}>
      <Button
        variant="secondary"
        icon="sparkles"
        label={reviewed ? 'Get new AI feedback' : 'Get AI feedback'}
        onPress={run}
        loading={feedback.isPending}
        disabled={words < MIN_WORDS || !online}
      />
      {words < MIN_WORDS ? (
        <Text style={styles.hint}>
          Write at least {MIN_WORDS} words for AI feedback ({words} so far).
        </Text>
      ) : !online ? (
        <Text style={styles.hint}>Connect to the internet to get AI feedback.</Text>
      ) : null}

      {r ? (
        <View style={styles.panel} accessibilityLiveRegion="polite">
          {outdated ? (
            <Text style={styles.hint}>You edited your essay after this feedback.</Text>
          ) : null}
          {r.prompt_fit !== 'no_prompt' ? (
            <View style={styles.row}>
              <Icon
                name={r.prompt_fit === 'strong' ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={fitColor}
              />
              <View style={styles.flex}>
                <Text style={[styles.label, { color: fitColor }]}>{FIT_TEXT[r.prompt_fit]}</Text>
                {r.prompt_fit_note ? <Text style={styles.text}>{r.prompt_fit_note}</Text> : null}
              </View>
            </View>
          ) : null}

          <List
            title="What works"
            items={r.strengths}
            icon="checkmark"
            color={colors.status.accepted}
            styles={styles}
          />
          <List
            title="To improve"
            items={r.improvements}
            icon="create"
            color={colors.primary}
            styles={styles}
          />

          {r.language_fixes.length ? (
            <View style={styles.group}>
              <Text style={styles.label}>Language</Text>
              {r.language_fixes.map((f) => (
                <Text key={f.original} style={styles.text}>
                  <Text style={styles.strike}>{f.original}</Text>
                  {'  →  '}
                  <Text style={styles.fix}>{f.suggestion}</Text>
                </Text>
              ))}
            </View>
          ) : null}

          {r.summary ? (
            <View style={styles.group}>
              <Text style={styles.label}>How a reader sums it up</Text>
              <Text style={styles.text}>{r.summary}</Text>
            </View>
          ) : null}

          <View style={styles.row}>
            <Icon name="sparkles" size={12} color={colors.textMuted} />
            <Text style={styles.disclaimer}>
              AI feedback, may be wrong. Keep your own voice: use it as suggestions, not a rewrite.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function List({
  title,
  items,
  icon,
  color,
  styles,
}: {
  title: string;
  items: string[];
  icon: 'checkmark' | 'create';
  color: string;
  styles: ReturnType<typeof createStyles>;
}) {
  if (!items.length) return null;
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.row}>
          <Icon name={icon} size={14} color={color} style={styles.bullet} />
          <Text style={[styles.text, styles.flex]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    root: { gap: spacing.sm },
    flex: { flex: 1 },
    hint: { ...type.caption, color: c.textMuted },
    panel: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      backgroundColor: c.surfaceMuted,
    },
    group: { gap: 6 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    bullet: { marginTop: 3 },
    label: { ...type.label, color: c.text },
    text: { ...type.caption, color: c.text },
    strike: { textDecorationLine: 'line-through', color: c.textMuted },
    fix: { fontFamily: fonts.medium, color: c.text },
    disclaimer: { ...type.caption, fontSize: 11, color: c.textMuted, flex: 1 },
  });
