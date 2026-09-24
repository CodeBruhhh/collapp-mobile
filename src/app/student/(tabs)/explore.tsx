import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function StudentExplore() {
  return (
    <PlaceholderScreen
      title="Explore"
      description="Find colleges and programs that fit you."
      features={[
        'University search with auto-complete',
        'Filter panel: major, location, and other criteria',
        'AI exploration engine: ranked matches from your profile',
      ]}
    />
  );
}
