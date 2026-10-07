import { useLocalSearchParams } from 'expo-router';

import { CollegeDetailScreen } from '@/screens/student/CollegeDetailScreen';

export default function StudentCollege() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CollegeDetailScreen id={id} />;
}
