import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './SettingsSection.styles';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  /** Editorial theme only: set the section on a lifted sheet band. */
  band?: boolean;
};

/** A titled card that groups related rows (a full-width ruled section in the editorial theme). */
export function SettingsSection({ title, children, band }: SettingsSectionProps) {
  const { colors, tokens } = useTheme();
  const styles = createStyles(colors, tokens);

  if (tokens.editorial) {
    return (
      <View style={[styles.ledger, band && styles.band]}>
        <Text accessibilityRole="header" style={styles.ledgerTitle}>
          {title}
        </Text>
        <View>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}
