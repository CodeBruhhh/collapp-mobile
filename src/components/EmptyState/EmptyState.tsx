import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './EmptyState.styles';

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
};

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={32} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}
