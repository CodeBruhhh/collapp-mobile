import { useLocalSearchParams } from 'expo-router';

import { PostInsightsScreen } from '@/screens/rep/PostInsightsScreen';

export default function RepPostInsights() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostInsightsScreen id={id} />;
}
