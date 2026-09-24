import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SectionHeader.styles';

type SectionHeaderProps = {
  title: string;
  /** Optional link on the right, e.g. "See All". Needs `onActionPress` too. */
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {actionLabel && onActionPress ? (
        <Pressable accessibilityRole="button" onPress={onActionPress} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}