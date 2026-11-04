import { Pressable, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './ChecklistRow.styles';

type ChecklistRowProps = {
  label: string;
  /** Where this item stands, e.g. "Approved" or "Resubmit: the scan is blurry". */
  status?: string;
  icon: IconName;
  color: string;
  action?: { label: string; onPress: () => void; disabled?: boolean };
  /** Opens the item, e.g. to view the file. */
  onPress?: () => void;
};

/** One requirement or document: its state, and what to do about it. */
export function ChecklistRow({ label, status, icon, color, action, onPress }: ChecklistRowProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const body = (
    <>
      <Icon name={icon} size={18} color={color} />
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {status ? <Text style={[styles.status, { color }]}>{status}</Text> : null}
      </View>
    </>
  );

  return (
    <View style={styles.row}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status ? `${label}, ${status}` : label}
          onPress={onPress}
          style={styles.main}>
          {body}
        </Pressable>
      ) : (
        <View style={styles.main} accessible>
          {body}
        </View>
      )}
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action.label}: ${label}`}
          accessibilityState={{ disabled: action.disabled }}
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.actionPressed,
            action.disabled && styles.actionDisabled,
          ]}>
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
