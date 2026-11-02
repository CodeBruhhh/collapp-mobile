import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

// Glyphs are the line icons from the Figma "Editorial Teal" frame.
const TABS: TabConfig[] = [
  {
    name: 'analytics',
    title: 'Analytics',
    icon: 'bar-chart-outline',
    glyph: require('@/assets/images/editorial/tab-analytics.svg'),
  },
  {
    name: 'accounts',
    title: 'Accounts',
    icon: 'people-outline',
    glyph: require('@/assets/images/editorial/tab-accounts.svg'),
  },
  {
    name: 'compliance',
    title: 'Compliance',
    icon: 'shield-outline',
    glyph: require('@/assets/images/editorial/tab-compliance.svg'),
  },
  {
    name: 'broadcast',
    title: 'Broadcast',
    icon: 'notifications-outline',
    glyph: require('@/assets/images/editorial/tab-broadcast.svg'),
  },
  {
    name: 'messages',
    title: 'Messages',
    icon: 'chatbubbles-outline',
    glyph: require('@/assets/images/editorial/tab-messages.svg'),
  },
];

export default function AdminTabsLayout() {
  return <RoleTabs tabs={TABS} badge="Admin" />;
}
