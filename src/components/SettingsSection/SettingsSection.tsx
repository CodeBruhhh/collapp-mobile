import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SettingsSection.styles';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  /** Set the section on a lifted sheet band. */
  band?: boolean;
};

/** A titled, full-width section whose rows rule themselves off. */
export function SettingsSection({ title, children, band }: SettingsSectionProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.section, band && styles.band]}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View>{children}</View>
    </View>
  );
}
