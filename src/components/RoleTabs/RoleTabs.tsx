import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';

import { SignOutButton } from '@/components/SignOutButton';
import { useTheme } from '@/hooks/useTheme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabConfig = {
  /** Must match the route file name, e.g. "home" -> home.tsx */
  name: string;
  title: string;
  /** Outline icon; the filled version is shown while the tab is selected. */
  icon: IconName;
  /** Set to false when the screen draws its own header. */
  headerShown?: boolean;
};

type RoleTabsProps = {
  tabs: TabConfig[];
  /** Right side of the header. Defaults to the dev sign-out button. */
  headerRight?: () => ReactNode;
};

/** Bottom-tab navigator shared by all three roles; each role only supplies its tab list. */
export function RoleTabs({ tabs, headerRight = () => <SignOutButton /> }: RoleTabsProps) {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text },
        headerRight,
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
            headerShown: tab.headerShown,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? (tab.icon.replace('-outline', '') as IconName) : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}