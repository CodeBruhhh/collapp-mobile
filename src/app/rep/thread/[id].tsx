import { useLocalSearchParams } from 'expo-router';

import { ChatScreen } from '@/screens/messaging/ChatScreen';

export default function RepThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen id={id} />;
}
