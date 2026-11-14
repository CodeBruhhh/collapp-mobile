import { useLocalSearchParams } from 'expo-router';

import { AddRepScreen } from '@/screens/admin/AddRepScreen';

export default function AdminAddRep() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AddRepScreen collegeId={id} />;
}
