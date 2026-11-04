import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

const TABS: TabConfig[] = [
  { name: 'analytics', title: 'Analytics', icon: 'bar-chart' },
  { name: 'accounts', title: 'Accounts', icon: 'people' },
  { name: 'compliance', title: 'Compliance', icon: 'shield' },
  { name: 'broadcast', title: 'Broadcast', icon: 'broadcast' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles' },
];

export default function AdminTabsLayout() {
  return <RoleTabs tabs={TABS} badge="Admin" />;
}
