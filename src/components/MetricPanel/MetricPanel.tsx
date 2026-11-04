import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createStyles } from './MetricPanel.styles';

type MetricPanelProps = {
  label: string;
  value: string | number;
  /** A short line under the figure, e.g. "days · BS Nursing". */
  caption?: string;
  icon?: IconName;
};

/** The notched teal panel that carries a screen's most important figure. */
export function MetricPanel({ label, value, caption, icon }: MetricPanelProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={styles.panel}
      accessible
      accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ''}`}>
      <Image
        source={require('@/assets/images/panel-notch.svg')}
        style={styles.shape}
        tintColor={colors.primary}
      />
      <View style={styles.heading}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {icon ? <Icon name={icon} size={15} color={colors.onPrimary} /> : null}
      </View>
      <View>
        <Text
          style={[styles.value, caption ? styles.valueWithCaption : null]}
          numberOfLines={1}
          adjustsFontSizeToFit>
          {value}
        </Text>
        {caption ? (
          <Text style={styles.caption} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
