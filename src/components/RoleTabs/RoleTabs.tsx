import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountButton } from '@/components/AccountButton';
import { Icon, type IconName } from '@/components/Icon';
import { NotificationBell } from '@/components/NotificationBell';
import { useUnreadMessageCount } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { fonts, radius, type, type ThemeColors } from '@/styles';

export type TabConfig = {
  /** Must match the route file name, e.g. "home" -> home.tsx */
  name: string;
  title: string;
  icon: IconName;
};

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    actions: { flexDirection: 'row', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontFamily: fonts.regular, fontSize: 19, letterSpacing: -0.6, color: c.text },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    badgeText: { ...type.overline, fontSize: 9, color: c.primary },
    tabButton: { flex: 1 },
    // Full-width track so flexbox centers the bar over the glyph (no offset math).
    indicatorTrack: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
    indicator: { width: 28, height: 2, backgroundColor: c.primary },
  });

function HeaderActions() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.actions}>
      <NotificationBell />
      <AccountButton />
    </View>
  );
}

/** Screen name plus an outlined role badge, e.g. "Analytics  ADMIN". */
function HeaderTitle({ title, badge }: { title: string; badge?: string }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={styles.titleRow}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

type RoleTabsProps = {
  tabs: TabConfig[];
  /** Role label shown beside the title. */
  badge?: string;
};

/** Bottom-tab navigator shared by all three roles; each role only supplies its tab list. */
export function RoleTabs({ tabs, badge }: RoleTabsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  // Every role has a "messages" tab; it shows the unread count (SDD 15).
  const unreadMessages = useUnreadMessageCount();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerRight: () => <HeaderActions />,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarBadgeStyle: {
          backgroundColor: colors.danger,
          fontFamily: fonts.medium,
          fontSize: 11,
        },
        // The current tab is marked with a short rule above its glyph.
        tabBarButton: (props) => (
          <Pressable
            onPress={props.onPress}
            onLongPress={props.onLongPress}
            testID={props.testID}
            aria-label={props['aria-label']}
            aria-selected={props['aria-selected']}
            role={props.role}
            style={[props.style, styles.tabButton]}>
            {props['aria-selected'] ? (
              <View style={styles.indicatorTrack} pointerEvents="none">
                <View style={styles.indicator} />
              </View>
            ) : null}
            {props.children}
          </Pressable>
        ),
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerTitle: () => <HeaderTitle title={tab.title} badge={badge} />,
            tabBarBadge: tab.name === 'messages' && unreadMessages ? unreadMessages : undefined,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} size={20} color={String(color)} />,
          }}
        />
      ))}
    </Tabs>
  );
}
