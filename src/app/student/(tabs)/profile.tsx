import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function StudentProfile() {
  return (
    <PlaceholderScreen
      title="Profile"
      description="Your academic profile and app settings."
      features={[
        'Academic background, target majors, preferred locations',
        'Biometric unlock (Face ID / fingerprint)',
        'Theme and notification preferences',
      ]}
    />
  );
}
