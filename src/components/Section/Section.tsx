import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './Section.styles';

type SectionProps = {
  title: string;
  children: ReactNode;
  /** Set the section on a lifted sheet band. */
  band?: boolean;
  /** A small link at the end of the heading, e.g. "See all". */
  trailing?: { label: string; onPress: () => void };
  /** Muted text at the end of the heading, e.g. "2 of 3 approved". */
  meta?: string;
};

/** A titled, full-width section whose rows rule themselves off. */
export function Section({ title, children, band, trailing, meta }: SectionProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.section, band && styles.band]}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {trailing ? (
          <Pressable accessibilityRole="link" hitSlop={12} onPress={trailing.onPress}>
            <Text style={styles.link}>{trailing.label}</Text>
          </Pressable>
        ) : null}
      </View>
      <View>{children}</View>
    </View>
  );
}
