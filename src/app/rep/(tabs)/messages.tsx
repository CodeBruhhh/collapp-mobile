import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function RepMessages() {
  return (
    <PlaceholderScreen
      title="Messages"
      description="Student inquiries and the admin channel."
      features={[
        'Student inquiry inbox',
        'Representative to Administrator channel',
        'Attachments with validation and scanning',
      ]}
    />
  );
}
