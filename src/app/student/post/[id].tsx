import { useLocalSearchParams } from 'expo-router';

import { PostDetailScreen } from '@/screens/student/PostDetailScreen';

export default function StudentPost() {
  const { id, comment } = useLocalSearchParams<{ id: string; comment?: string }>();
  return <PostDetailScreen id={id} focusComment={comment === '1'} />;
}
