import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function RepInstitution() {
  return (
    <PlaceholderScreen
      title="Institution"
      description="Your college profile and admission requirements."
      features={[
        'Institutional profile builder: description, programs, media',
        'Requirement builder: essay prompts, prerequisites, deadlines',
        'Draft / published status',
      ]}
    />
  );
}
