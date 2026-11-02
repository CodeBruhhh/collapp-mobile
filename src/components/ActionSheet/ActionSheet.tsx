import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/validation';

import { createStyles } from './ActionSheet.styles';

export type SheetAction = {
  label: string;
  /** May return a promise; the sheet shows progress and closes when it resolves. */
  onPress: () => void | Promise<unknown>;
  hint?: string;
  destructive?: boolean;
  disabled?: boolean;
  /** Ask again inside the sheet before running a consequential action. */
  confirm?: { title: string; message: string; label: string };
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Small caps label above the title, e.g. the record type. */
  eyebrow?: string;
  subtitle?: string;
  /** Plain explanation under the header, for confirmation-only sheets. */
  message?: string;
  /** Ruled detail rows (e.g. <InfoRow />) shown before the actions. */
  children?: ReactNode;
  actions?: SheetAction[];
  cancelLabel?: string;
};

/**
 * Themed bottom sheet that replaces the platform alert for record actions and
 * confirmations, so choices stay in the app's own type, color and rhythm.
 */
export function ActionSheet({
  visible,
  onClose,
  title,
  eyebrow,
  subtitle,
  message,
  children,
  actions = [],
  cancelLabel = 'Cancel',
}: ActionSheetProps) {
  const { colors, tokens } = useTheme();
  const styles = createStyles(colors, tokens);
  // Core Animated: Reanimated layout animations inside a Modal swallowed taps on Android.
  const [rise] = useState(() => new Animated.Value(48));

  useEffect(() => {
    if (!visible) return;
    rise.setValue(48);
    Animated.timing(rise, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [visible, rise]);
  const [confirming, setConfirming] = useState<SheetAction | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (running) return;
    setConfirming(null);
    setError(null);
    onClose();
  }

  async function run(action: SheetAction) {
    setError(null);
    setRunning(action.label);
    try {
      await action.onPress();
      setRunning(null);
      setConfirming(null);
      onClose();
    } catch (e) {
      setRunning(null);
      setError(getErrorMessage(e));
    }
  }

  function press(action: SheetAction) {
    if (action.confirm && confirming !== action) setConfirming(action);
    else run(action);
  }

  const renderAction = (action: SheetAction) => {
    const busy = running === action.label;
    return (
      <Pressable
        key={action.label}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        accessibilityHint={action.hint}
        accessibilityState={{ disabled: action.disabled || Boolean(running), busy }}
        disabled={action.disabled || Boolean(running)}
        onPress={() => press(action)}
        style={({ pressed }) => [
          styles.action,
          pressed && styles.actionPressed,
          action.disabled && styles.actionDisabled,
        ]}>
        <View style={styles.actionText}>
          <Text style={[styles.actionLabel, action.destructive && styles.actionDanger]}>
            {action.label}
          </Text>
          {action.hint ? <Text style={styles.actionHint}>{action.hint}</Text> : null}
        </View>
        {busy ? (
          <ActivityIndicator
            size="small"
            color={action.destructive ? colors.danger : colors.primary}
          />
        ) : (
          <Image
            source={require('@/assets/images/editorial/chevron.svg')}
            style={styles.icon}
            tintColor={colors.textMuted}
          />
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      {/* Same structure as DateField: tapping the dim backdrop closes; the inner
          press handler keeps taps on the sheet itself from reaching it. */}
      <Pressable style={styles.backdrop} onPress={close} accessible={false}>
        <Animated.View style={[styles.frame, { transform: [{ translateY: rise }] }]}>
          <Pressable onPress={() => {}} accessible={false} style={styles.shrink}>
            <SafeAreaView edges={['bottom']} style={styles.sheet}>
              <View style={styles.handle} />
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {confirming?.confirm ? (
                  <>
                    <View style={styles.header}>
                      <Text style={styles.eyebrow}>Confirm</Text>
                      <Text
                        accessibilityRole="header"
                        style={[styles.title, confirming.destructive && styles.titleDanger]}>
                        {confirming.confirm.title}
                      </Text>
                    </View>
                    <Text style={styles.message}>{confirming.confirm.message}</Text>
                    <View style={styles.actions}>
                      {renderAction({
                        ...confirming,
                        label: confirming.confirm.label,
                        hint: undefined,
                      })}
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.header}>
                      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
                      <Text accessibilityRole="header" style={styles.title}>
                        {title}
                      </Text>
                      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    </View>
                    {message ? <Text style={styles.message}>{message}</Text> : null}
                    {children ? <View style={styles.details}>{children}</View> : null}
                    {actions.length ? (
                      <View style={styles.actions}>{actions.map(renderAction)}</View>
                    ) : null}
                  </>
                )}
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <View style={styles.footer}>
                  <Button
                    variant="secondary"
                    label={confirming ? 'Go back' : cancelLabel}
                    onPress={confirming ? () => setConfirming(null) : close}
                    disabled={Boolean(running)}
                  />
                </View>
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
