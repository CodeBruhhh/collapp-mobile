import { useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  View,
  type DimensionValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Skeleton.styles';

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  /** Corner radius; pass height / 2 for a circle. */
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulse shared by every block in a skeleton layout so they breathe together. */
function usePulse() {
  // Created once; state (not a ref) so reading it during render is allowed.
  const [opacity] = useState(() => new Animated.Value(1));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduceMotion]);

  return opacity;
}

/** One placeholder block. Use inside <SkeletonGroup> so blocks pulse in sync. */
export function Skeleton({ width = '100%', height = 14, radius = 6, style }: SkeletonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.block, { width, height, borderRadius: radius }, style]} />;
}

/** Wraps skeleton blocks: one pulse animation, hidden from screen readers but announced once. */
export function SkeletonGroup({
  children,
  label,
  style,
}: {
  children: ReactNode;
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = usePulse();
  return (
    <Animated.View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}

/** Placeholder for a conversation: alternating message bubbles. */
export function ChatSkeleton() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const bubbles: { mine: boolean; width: DimensionValue; height: number }[] = [
    { mine: false, width: '62%', height: 44 },
    { mine: true, width: '48%', height: 36 },
    { mine: false, width: '70%', height: 64 },
    { mine: true, width: '56%', height: 44 },
  ];
  return (
    <SkeletonGroup style={styles.chat} label="Loading messages">
      {bubbles.map((b, i) => (
        <View key={i} style={b.mine ? styles.mine : undefined}>
          <Skeleton width={b.width} height={b.height} radius={16} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** Placeholder for a list of cards (logo/avatar, title and two lines). */
export function ListSkeleton({
  rows = 5,
  avatar = true,
  label,
}: {
  rows?: number;
  avatar?: boolean;
  label?: string;
}) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <SkeletonGroup style={styles.list} label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.card}>
          {avatar ? <Skeleton width={44} height={44} radius={12} /> : null}
          <View style={styles.lines}>
            <Skeleton width="62%" height={16} />
            <Skeleton width="88%" />
            <Skeleton width="40%" />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** Placeholder for a detail screen: heading, a summary card and a few sections. */
export function DetailSkeleton({ label }: { label?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <SkeletonGroup style={styles.detail} label={label}>
      <View style={styles.lines}>
        <Skeleton width="70%" height={24} />
        <Skeleton width="45%" />
      </View>
      <View style={styles.block2}>
        <Skeleton width={96} height={22} radius={11} />
        <Skeleton height={6} radius={3} />
        <Skeleton width="90%" />
        <Skeleton width="60%" />
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={styles.block2}>
          <Skeleton width="40%" height={16} />
          <Skeleton />
          <Skeleton width="80%" />
        </View>
      ))}
    </SkeletonGroup>
  );
}

/** A few short lines, for loading content inside an existing card. */
export function InlineSkeleton({ lines = 3, label }: { lines?: number; label?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <SkeletonGroup style={styles.lines} label={label}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '55%' : '100%'} />
      ))}
    </SkeletonGroup>
  );
}
