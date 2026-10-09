import { useLocalSearchParams } from 'expo-router';

import { ApplicationDetailScreen } from '@/screens/student/ApplicationDetailScreen';

export default function StudentApplication() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApplicationDetailScreen id={id} />;
}
