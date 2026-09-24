import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function StudentHome() {
  return (
    <PlaceholderScreen
      title="Home"
      description="Your feed and application overview at a glance."
      features={[
        'Application summary cards: total, accepted, under review',
        'Algorithmic institutional content feed',
        'AI-recommended colleges and programs',
        'Recent application activity',
      ]}
    />
  );
}
