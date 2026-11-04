import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { rhythm } from '@/styles';

import { createStyles } from './Masthead.styles';

type MastheadProps = {
  title?: string;
  subtitle?: string;
  /** Small caps line above the title. */
  eyebrow?: string;
  /** Replaces the title, e.g. the Wordmark. */
  brand?: ReactNode;
  /** A row of controls above the title, e.g. back and save. */
  top?: ReactNode;
  /** A picture beside the title. */
  logo?: ReactNode;
  stats?: { label: string; value: string | number }[];
  /** The taller opening version, for the sign-in screen. */
  tall?: boolean;
};

/** The teal notched header for a screen with no navigation bar above it. */
export function Masthead({
  title,
  subtitle,
  eyebrow,
  brand,
  top,
  logo,
  stats,
  tall,
}: MastheadProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.root, tall && styles.tall, { paddingTop: insets.top + rhythm.gutter / 2 }]}>
      <StatusBar style={isDark ? 'dark' : 'light'} />
      {top ? <View style={styles.top}>{top}</View> : null}
      <View style={styles.identity}>
        {logo}
        <View style={styles.text}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {brand}
          {title ? (
            <Text accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
          ) : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {stats?.length ? (
        <View style={styles.stats}>
          {stats.map((s) => (
            <View key={s.label} accessible accessibilityLabel={`${s.label}: ${s.value}`}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.notch} />
    </View>
  );
}
