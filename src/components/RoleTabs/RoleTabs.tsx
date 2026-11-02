import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AccountButton } from '@/components/AccountButton';
import { NotificationBell } from '@/components/NotificationBell';
import { useUnreadMessageCount } from '@/features/messaging/hooks';
import { useTheme } from '@/hooks/useTheme';
import { fontSize, fontWeight, type ThemeColors } from '@/styles';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type TabConfig = {
  /** Must match the route file name, e.g. "home" -> home.tsx */
  name: string;
  title: string;
  icon: IconName;
  /** Line glyph (SVG asset) used instead of `icon` in the editorial theme. */
  glyph?: number;
};

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    actions: { flexDirection: 'row', alignItems: 'center' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    title: { fontSize: 19, letterSpacing: -0.6, color: c.text },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: fontWeight.semibold,
      letterSpacing: 1,
      color: c.primary,
      textTransform: 'uppercase',
    },
    tabButton: { flex: 1 },
    // Full-width track so flexbox centers the bar over the glyph (no offset math).
    indicatorTrack: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
    indicator: { width: 28, height: 2, backgroundColor: c.primary },
    glyph: { width: 20, height: 20 },
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
function EditorialTitle({ title, badge }: { title: string; badge?: string }) {
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
  /** Role label shown beside the title in the editorial header. */
  badge?: string;
};

/** Bottom-tab navigator shared by all three roles; each role only supplies its tab list. */
export function RoleTabs({ tabs, badge }: RoleTabsProps) {
  const { colors, tokens } = useTheme();
  const styles = createStyles(colors);
  // Every role has a "messages" tab; it shows the unread count (SDD 15).
  const unreadMessages = useUnreadMessageCount();
  const editorial = tokens.editorial;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: editorial ? colors.background : colors.surface,
          ...(editorial && { borderBottomWidth: StyleSheet.hairlineWidth }),
          borderBottomColor: colors.border,
        },
        headerShadowVisible: false,
        headerTitleAlign: editorial ? 'left' : undefined,
        headerTitleStyle: {
          color: colors.text,
          fontSize: fontSize.lg,
          fontWeight: fontWeight.semibold,
        },
        headerRight: () => <HeaderActions />,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: editorial
          ? { fontSize: 10, fontWeight: fontWeight.medium }
          : { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarBadgeStyle: { backgroundColor: colors.danger, fontSize: 11 },
        // The editorial bar marks the current tab with a short rule above it.
        tabBarButton: editorial
          ? (props) => (
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
            )
          : undefined,
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerTitle: editorial
              ? () => <EditorialTitle title={tab.title} badge={badge} />
              : undefined,
            tabBarBadge: tab.name === 'messages' && unreadMessages ? unreadMessages : undefined,
            // Filled glyph marks the current tab; outline for the rest. The
            // editorial bar keeps outlines and uses its indicator instead.
            tabBarIcon: ({ focused, color, size }) =>
              editorial && tab.glyph ? (
                <Image source={tab.glyph} style={styles.glyph} tintColor={String(color)} />
              ) : (
                <Ionicons
                  name={
                    focused && !editorial
                      ? (tab.icon.replace(/-outline$/, '') as IconName)
                      : tab.icon
                  }
                  size={editorial ? 21 : size}
                  color={color}
                />
              ),
          }}
        />
      ))}
    </Tabs>
  );
}
