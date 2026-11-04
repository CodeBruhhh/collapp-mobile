import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Notice.styles';

type NoticeProps = {
  title: string;
  message?: string;
  tone?: 'info' | 'danger';
  icon?: IconName;
  /** Makes the whole notice open something, with a chevron. */
  onPress?: () => void;
  /** A small action at the end, e.g. "Sync now". */
  action?: { label: string; onPress: () => void };
};

/** A ruled inline banner for states that need a glance: offline, sync, action required. */
export function Notice({ title, message, tone = 'info', icon, onPress, action }: NoticeProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const color = tone === 'danger' ? colors.danger : colors.primary;

  const body = (
    <>
      <Icon name={icon ?? 'alert-circle'} size={18} color={color} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} style={styles.action}>
          <Text style={[styles.actionText, { color }]}>{action.label}</Text>
        </Pressable>
      ) : null}
      {onPress ? <Icon name="chevron-forward" size={16} color={colors.textMuted} /> : null}
    </>
  );
  const edge = { borderColor: color };

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={message ? `${title}. ${message}` : title}
        onPress={onPress}
        style={({ pressed }) => [styles.notice, edge, pressed && styles.pressed]}>
        {body}
      </Pressable>
    );
  }
  return (
    <View style={[styles.notice, edge]} accessibilityLiveRegion="polite">
      {body}
    </View>
  );
}
