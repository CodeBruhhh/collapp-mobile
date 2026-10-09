import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ROLE_HOME } from '@/types/roles';

/** Entry point: send the user to their role's home, onboarding, or login. */
export default function Index() {
  const { role, needsOnboarding } = useAuth();
  if (!role) return <Redirect href="/login" />;
  if (needsOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href={ROLE_HOME[role]} />;
}
