import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { DetailSkeleton, InlineSkeleton, ListSkeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './StateView.styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

type LoadingStateProps = {
  /**
   * list: a column of card placeholders (default); detail: a whole screen;
   * inline: a few lines inside an existing card.
   */
  variant?: 'list' | 'detail' | 'inline';
  rows?: number;
  /** What screen readers announce while it loads. */
  label?: string;
};

/** Skeleton placeholders shaped like the content that is loading. */
export function LoadingState({ variant = 'list', rows, label }: LoadingStateProps) {
  if (variant === 'detail') return <DetailSkeleton label={label} />;
  if (variant === 'inline') return <InlineSkeleton lines={rows} label={label} />;
  return <ListSkeleton rows={rows} label={label} />;
}

const NETWORK_ERROR = /network request failed|failed to fetch|network ?error|timed? ?out/i;

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const message = getErrorMessage(error);
  const offline = NETWORK_ERROR.test(message);

  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <Ionicons
          name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
          size={28}
          color={colors.textMuted}
        />
      </View>
      <Text style={styles.title}>{offline ? "You're offline" : "Couldn't load this"}</Text>
      <Text style={styles.body}>
        {offline ? 'Check your internet connection, then try again.' : message}
      </Text>
      {onRetry ? (
        <View style={styles.action}>
          <Button label="Try again" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

type EmptyStateProps = {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.root}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
