import { Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { IconName } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';

import { createHeaderStyles } from './ChatScreen.styles';

type ChatHeaderProps = {
  title: string;
  subtitle?: string;
  logoPath?: string | null;
  icon?: IconName;
};

/** Picture, name and context line for the top of a conversation. */
export function ChatHeader({ title, subtitle, logoPath, icon }: ChatHeaderProps) {
  const { colors } = useTheme();
  const styles = createHeaderStyles(colors);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}>
      <Avatar name={title} logoPath={logoPath} icon={icon} size={36} onAccent />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
