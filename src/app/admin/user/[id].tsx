import { useLocalSearchParams } from 'expo-router';

import { UserAccessScreen } from '@/screens/admin/UserAccessScreen';

export default function AdminUserAccess() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <UserAccessScreen userId={id} />;
}
