import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function AdminCompliance() {
  return (
    <PlaceholderScreen
      title="Compliance"
      description="Security, isolation and messaging oversight."
      features={[
        'RLS / tenant-isolation policy oversight',
        'Messaging compliance review',
        'Audit log viewer',
      ]}
    />
  );
}
