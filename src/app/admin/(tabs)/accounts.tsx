import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AdminAccounts() {
  return (
    <PlaceholderScreen
      title="Accounts"
      description="Manage users and institutions (tenants)."
      features={[
        'Activate, suspend, or adjust permissions for users and tenants',
        'Search and filter accounts',
      ]}
    />
  );
}
