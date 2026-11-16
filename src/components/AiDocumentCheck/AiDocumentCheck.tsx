import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AiUsageMeter } from '@/components/AiUsageMeter';
import { Icon } from '@/components/Icon';
import type { DocumentCheck, DocumentCheckVerdict } from '@/features/ai/api';
import { useAiAllowance } from '@/features/ai/hooks';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './AiDocumentCheck.styles';

type AiDocumentCheckProps = {
  check: DocumentCheck | undefined;
  /** The file was just uploaded and its check hasn't started yet. */
  awaiting?: boolean;
  /** Students get instructions; reviewers get a neutral read-out. */
  audience: 'student' | 'rep';
  onRecheck?: () => void;
  rechecking?: boolean;
};

const VERDICT_TEXT: Record<'student' | 'rep', Record<DocumentCheckVerdict, string>> = {
  student: {
    pass: 'Looks right',
    review: 'Take a second look',
    fail: 'This may be the wrong file',
  },
  rep: {
    pass: 'AI: looks right',
    review: 'AI: needs a closer look',
    fail: 'AI: likely wrong or unrelated',
  },
};

/**
 * Advisory AI read-out of one uploaded document: is it relevant, the right
 * document, and complete, plus a summary and the details the AI could read.
 */
export function AiDocumentCheck({
  check,
  awaiting,
  audience,
  onRecheck,
  rechecking,
}: AiDocumentCheckProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showDetails, setShowDetails] = useState(false);
  // Re-checks count against the person's daily limit; block the link when it is used up.
  const allowance = useAiAllowance('document_check');
  const blocked = allowance.exhausted || allowance.paused;

  const recheck = onRecheck ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: rechecking || blocked, busy: rechecking }}
      hitSlop={10}
      disabled={rechecking || blocked}
      onPress={onRecheck}>
      {rechecking ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={[styles.link, blocked && { color: colors.textMuted }]}>
          {check ? 'Check again' : 'Check with AI'}
        </Text>
      )}
    </Pressable>
  ) : null;
  const meter = onRecheck ? <AiUsageMeter kind="document_check" /> : null;

  if (!check || check.status === 'pending') {
    if (!check && !awaiting) {
      // Uploaded before AI checks existed: offer a manual run.
      return recheck ? (
        <View style={styles.stack}>
          <View style={styles.footer}>{recheck}</View>
          {meter}
        </View>
      ) : null;
    }
    return (
      <View
        style={[styles.panel, { borderLeftColor: colors.border }]}
        accessibilityLiveRegion="polite">
        <View style={styles.header}>
          <ActivityIndicator size="small" color={colors.textMuted} />
          <Text style={styles.muted}>AI is checking this document…</Text>
        </View>
      </View>
    );
  }

  if (check.status !== 'done' || !check.verdict) {
    return (
      <View style={[styles.panel, { borderLeftColor: colors.border }]}>
        <View style={styles.header}>
          <Icon name="sparkles" size={16} color={colors.textMuted} />
          <Text style={styles.muted}>
            {check.error ?? 'The AI check could not run.'}
            {check.status === 'failed' ? ' It will retry automatically.' : ''}
          </Text>
        </View>
        {recheck ? <View style={styles.footer}>{recheck}</View> : null}
        {meter}
      </View>
    );
  }

  const tone =
    check.verdict === 'pass'
      ? colors.status.accepted
      : check.verdict === 'review'
        ? colors.status.underReview
        : colors.danger;
  const hasDetails = Boolean(check.summary) || check.key_details.length > 0;

  return (
    <View style={[styles.panel, { borderLeftColor: tone }]} accessibilityLiveRegion="polite">
      <View style={styles.header}>
        <Icon
          name={check.verdict === 'pass' ? 'checkmark-circle' : 'alert-circle'}
          size={18}
          color={tone}
        />
        <View style={styles.headerText}>
          <Text style={[styles.verdict, { color: tone }]}>
            {VERDICT_TEXT[audience][check.verdict]}
          </Text>
          {check.detected_type ? (
            <Text style={styles.detected}>Looks like: {check.detected_type}</Text>
          ) : null}
        </View>
      </View>

      {check.issues.map((issue) => (
        <View key={issue} style={styles.issue}>
          <Icon name="ellipse" size={8} color={tone} style={styles.bullet} />
          <Text style={styles.issueText}>{issue}</Text>
        </View>
      ))}

      {showDetails ? (
        <>
          {check.summary ? <Text style={styles.summary}>{check.summary}</Text> : null}
          {check.key_details.length ? (
            <View style={styles.details}>
              {check.key_details.map((d) => (
                <View key={`${d.label}:${d.value}`} style={styles.detail}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <View style={styles.footer}>
        <Icon name="sparkles" size={12} color={colors.textMuted} />
        <Text style={styles.disclaimer}>
          {audience === 'student'
            ? 'AI check, may be wrong. The college makes the final review.'
            : 'Advisory AI check, may be wrong.'}
        </Text>
        <View style={styles.links}>
          {hasDetails ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showDetails }}
              hitSlop={10}
              onPress={() => setShowDetails((v) => !v)}>
              <Text style={styles.link}>{showDetails ? 'Hide summary' : 'Summary'}</Text>
            </Pressable>
          ) : null}
          {recheck}
        </View>
      </View>
      {meter}
    </View>
  );
}
