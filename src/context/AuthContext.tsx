import { createContext, useContext, useState, type ReactNode } from 'react';

import type { Role } from '@/types/roles';

type AuthContextValue = {
  /** `null` means signed out. */
  role: Role | null;
  /** DEV ONLY: pick a role without credentials. Replace with Supabase Auth. */
  signInAs: (role: Role) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// TODO(supabase): restore the session on launch, read `role` from the Users
// table, and expose a loading state so the splash screen stays up meanwhile.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <AuthContext value={{ role, signInAs: setRole, signOut: () => setRole(null) }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
