import { NotificationButton } from '@/components/NotificationButton/NotificationButton';
import { RoleTabs, type TabConfig } from '@/components/RoleTabs';

const TABS: TabConfig[] = [
  // Home draws its own header (logo, title, bell), so the navigator header is off.
  { name: 'home', title: 'Home', icon: 'home-outline', headerShown: false },
  { name: 'explore', title: 'Explore', icon: 'search-outline' },
  { name: 'applications', title: 'Applications', icon: 'document-text-outline' },
  { name: 'messages', title: 'Messages', icon: 'chatbubbles-outline' },
  { name: 'profile', title: 'Profile', icon: 'person-outline' },
];

export default function StudentTabsLayout() {
  return <RoleTabs tabs={TABS} headerRight={() => <NotificationButton />} />;
}