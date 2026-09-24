import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AdminMessages() {
  return (
    <PlaceholderScreen
      title="Messages"
      description="Representative to Administrator channel."
      features={[
        'Threads with school representatives',
        'No direct student messaging from this channel',
      ]}
    />
  );
}
