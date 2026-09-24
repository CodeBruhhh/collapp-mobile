import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function StudentApplications() {
  return (
    <PlaceholderScreen
      title="Applications"
      description="Track every application and manage drafts."
      features={[
        'Progress bars and milestone badges: Draft, Submitted, Under Review, Accepted, Action Required',
        'Deadline countdowns',
        'Offline draft editor with save and sync status',
        'Camera document scanner with edge detection, crop and enhancement',
        'Final submission requires an internet connection',
      ]}
    />
  );
}
