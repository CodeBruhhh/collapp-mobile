import { Text } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { fonts } from '@/styles';

type WordmarkProps = {
  size?: number;
  /** Colors for sitting on teal. */
  onAccent?: boolean;
};

/** The CollApp name in the serif. */
export function Wordmark({ size = 19, onAccent }: WordmarkProps) {
  const { colors } = useTheme();

  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: fonts.serif,
        fontSize: size,
        lineHeight: size * 1.25,
        letterSpacing: -size * 0.035,
        color: onAccent ? colors.onPrimary : colors.primary,
      }}>
      CollApp
    </Text>
  );
}
