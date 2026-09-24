import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AdminBroadcast() {
  return (
    <PlaceholderScreen
      title="Broadcast"
      description="Send announcements to users."
      features={[
        'Push notification broadcast composer',
        'Sent broadcast history',
      ]}
    />
  );
}
