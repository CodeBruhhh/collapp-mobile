import { Redirect } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { ROLE_HOME } from '@/types/roles';

/** Entry point: send the user to their role's home, or to login when signed out. */
export default function Index() {
  const { role } = useAuth();
  return <Redirect href={role ? ROLE_HOME[role] : '/login'} />;
}
