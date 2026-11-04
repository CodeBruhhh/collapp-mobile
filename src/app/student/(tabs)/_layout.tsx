import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

const TABS: TabConfig[] = [
  { name: 'home', title: 'Home', icon: 'home' },
  { name: 'explore', title: 'Explore', icon: 'search' },
  { name: 'applications', title: 'Applications', icon: 'document-text' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles' },
  { name: 'profile', title: 'Profile', icon: 'person' },
];

export default function StudentTabsLayout() {
  return <RoleTabs tabs={TABS} />;
}
