import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './LedgerRow.styles';

type LedgerRowProps = {
  title: string;
  subtitle?: string;
  /** Extra lines under the subtitle, e.g. a deadline mark. */
  children?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** The list's first row also rules its top edge. */
  first?: boolean;
  onPress?: () => void;
  /** Secondary actions (e.g. delete); also offered to screen readers as a custom action. */
  onLongPress?: () => void;
  accessibilityLabel?: string;
  numberOfLines?: number;
};

/** One ruled line of a list; shows a chevron when it opens something. */
export function LedgerRow({
  title,
  subtitle,
  children,
  leading,
  trailing,
  first,
  onPress,
  onLongPress,
  accessibilityLabel,
  numberOfLines = 2,
}: LedgerRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const body = (
    <>
      {leading}
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={numberOfLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={numberOfLines}>
            {subtitle}
          </Text>
        ) : null}
        {children}
      </View>
      {trailing}
      {onPress && !trailing ? (
        <Icon name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={[styles.row, first && styles.first]}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={
        onLongPress ? [{ name: 'longpress', label: 'More options' }] : undefined
      }
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && onLongPress?.()}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [styles.row, first && styles.first, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}
