import { useLocalSearchParams } from 'expo-router';

import { ApplyScreen } from '@/screens/student/ApplyScreen';

export default function StudentApply() {
  const { collegeId } = useLocalSearchParams<{ collegeId: string }>();
  return <ApplyScreen collegeId={collegeId} />;
}
