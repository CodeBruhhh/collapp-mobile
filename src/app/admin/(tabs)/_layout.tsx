import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

const TABS: TabConfig[] = [
  { name: 'analytics', title: 'Analytics', icon: 'bar-chart-outline' },
  { name: 'accounts', title: 'Accounts', icon: 'people-circle-outline' },
  { name: 'compliance', title: 'Compliance', icon: 'shield-checkmark-outline' },
  { name: 'broadcast', title: 'Broadcast', icon: 'notifications-outline' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles-outline' },
];

export default function AdminTabsLayout() {
  return <RoleTabs tabs={TABS} />;
}
