import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function RepDashboard() {
  return (
    <PlaceholderScreen
      title="Dashboard"
      description="What needs your attention today."
      features={[
        'Applicant and inquiry summary',
        'Pending document verifications',
        'Upcoming deadlines for your institution',
      ]}
    />
  );
}
