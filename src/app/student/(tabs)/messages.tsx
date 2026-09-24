import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function StudentMessages() {
  return (
    <PlaceholderScreen
      title="Messages"
      description="Formal inquiries to school representatives."
      features={[
        'Inquiry threads with verified school representatives',
        'Attachments: documents, images, official letters',
        'No student-to-student messaging (blocked by RLS)',
      ]}
    />
  );
}
