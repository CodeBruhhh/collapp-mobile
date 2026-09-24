import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function RepApplicants() {
  return (
    <PlaceholderScreen
      title="Applicants"
      description="Screen and process applications to your institution."
      features={[
        'Applicant queue with AI fit score and enrollment likelihood',
        'Document verification with approve / reject actions',
        'Only applications to your own institution (RLS tenant isolation)',
      ]}
    />
  );
}
