import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { NotificationBell } from '@/components/NotificationBell';
import { SignOutButton } from '@/components/SignOutButton';
import { useUnreadMessageCount } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabConfig = {
  /** Must match the route file name, e.g. "home" -> home.tsx */
  name: string;
  title: string;
  icon: IconName;
};

const styles = StyleSheet.create({ actions: { flexDirection: 'row' } });

function HeaderActions() {
  return (
    <View style={styles.actions}>
      <NotificationBell />
      <SignOutButton />
    </View>
  );
}

/** Bottom-tab navigator shared by all three roles; each role only supplies its tab list. */
export function RoleTabs({ tabs }: { tabs: TabConfig[] }) {
  const { colors } = useTheme();
  // Every role has a "messages" tab; it shows the unread count (SDD 15).
  const unreadMessages = useUnreadMessageCount();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        headerRight: () => <HeaderActions />,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.name === 'messages' && unreadMessages ? unreadMessages : undefined,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
