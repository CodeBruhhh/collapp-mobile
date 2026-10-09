import { useLocalSearchParams } from 'expo-router';

import { PostEditorScreen } from '@/screens/rep/PostEditorScreen';

export default function RepPost() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostEditorScreen id={id} />;
}
