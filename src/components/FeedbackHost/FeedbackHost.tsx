import { useEffect, useState, useSyncExternalStore } from 'react';
import { AccessibilityInfo, Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';
import {
  dismissToast,
  getFeedback,
  settleAsk,
  subscribeFeedback,
  type Toast,
  type ToastTone,
} from '@/lib/feedback';

import { createStyles } from './FeedbackHost.styles';

const TONE_ICON: Record<ToastTone, IconName> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'alert-circle',
};

/** Errors carry more to read, so they stay up longer. */
const VISIBLE_MS: Record<ToastTone, number> = { success: 3500, info: 4500, error: 6500 };

function ToastBanner({ toast }: { toast: Toast }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();
  const [rise] = useState(() => new Animated.Value(-24));
  const toneColor = {
    success: colors.status.accepted,
    error: colors.danger,
    info: colors.primary,
  }[toast.tone];

  useEffect(() => {
    Animated.timing(rise, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    AccessibilityInfo.announceForAccessibility(
      toast.message ? `${toast.title}. ${toast.message}` : toast.title,
    );
    const timer = setTimeout(() => dismissToast(toast.id), VISIBLE_MS[toast.tone]);
    return () => clearTimeout(timer);
  }, [rise, toast]);

  return (
    <View style={[styles.anchor, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ translateY: rise }] }}>
        <Pressable
          accessibilityRole="alert"
          accessibilityHint="Tap to dismiss"
          onPress={() => dismissToast(toast.id)}
          style={[styles.toast, { borderTopColor: toneColor }]}>
          <Icon name={TONE_ICON[toast.tone]} size={18} color={toneColor} />
          <View style={styles.text}>
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Mounted once at the root: shows everything sent through `ask` and `notify`. */
export function FeedbackHost() {
  const { ask, toast } = useSyncExternalStore(subscribeFeedback, getFeedback);
  const cancel = ask?.buttons.find((b) => b.style === 'cancel');

  return (
    <>
      {ask ? (
        <ActionSheet
          key={ask.id}
          visible
          onClose={() => settleAsk(ask.id)}
          title={ask.title}
          message={ask.message}
          cancelLabel={cancel?.text ?? 'Close'}
          actions={ask.buttons
            .filter((b) => b.style !== 'cancel')
            .map((b) => ({
              label: b.text,
              destructive: b.style === 'destructive',
              onPress: () => settleAsk(ask.id, b),
            }))}
        />
      ) : null}
      {toast ? <ToastBanner key={toast.id} toast={toast} /> : null}
    </>
  );
}
