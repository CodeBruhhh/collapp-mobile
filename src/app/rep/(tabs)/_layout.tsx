import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

const TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Dashboard', icon: 'grid' },
  { name: 'applicants', title: 'Applicants', icon: 'people' },
  { name: 'posts', title: 'Posts', icon: 'megaphone' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles' },
  { name: 'institution', title: 'Institution', icon: 'school' },
];

export default function RepTabsLayout() {
  return <RoleTabs tabs={TABS} badge="Rep" />;
}
