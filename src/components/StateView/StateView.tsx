import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './StateView.styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.root} accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.root}>
      <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
      <Text style={styles.title}>Couldn&apos;t load this</Text>
      <Text style={styles.body}>{getErrorMessage(error)}</Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
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
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
