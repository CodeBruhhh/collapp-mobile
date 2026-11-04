import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './PageHeading.styles';

type PageHeadingProps = {
  title: string;
  subtitle?: string;
  /** A control beside the title, e.g. an icon button. */
  action?: ReactNode;
};

/** The serif heading that opens a screen. */
export function PageHeading({ title, subtitle, action }: PageHeadingProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {action}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
