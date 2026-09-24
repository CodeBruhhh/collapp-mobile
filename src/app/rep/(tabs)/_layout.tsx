import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

const TABS: TabConfig[] = [
  { name: 'dashboard', title: 'Dashboard', icon: 'grid-outline' },
  { name: 'applicants', title: 'Applicants', icon: 'people-outline' },
  { name: 'posts', title: 'Posts', icon: 'megaphone-outline' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles-outline' },
  { name: 'institution', title: 'Institution', icon: 'school-outline' },
];

export default function RepTabsLayout() {
  return <RoleTabs tabs={TABS} />;
}
