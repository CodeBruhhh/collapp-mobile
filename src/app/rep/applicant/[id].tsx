import { useLocalSearchParams } from 'expo-router';

import { ApplicantDetailScreen } from '@/screens/rep/ApplicantDetailScreen';

export default function RepApplicant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ApplicantDetailScreen id={id} />;
}
