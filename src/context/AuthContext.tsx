import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  authenticateWithBiometrics,
  isBiometricEnabled,
  offerBiometricUnlock,
} from '@/lib/biometrics';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';
import type { Role } from '@/types/roles';

type Profile = Pick<
  Tables<'profiles'>,
  'id' | 'role' | 'college_id' | 'full_name' | 'email' | 'status' | 'avatar_path'
>;

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  /** `null` means signed out (or profile not loaded yet). */
  role: Role | null;
  /** True for students who have not finished the academic profile (SDD screen 5). */
  needsOnboarding: boolean;
  /** True until the stored session has been restored on launch. */
  isLoading: boolean;
  /** A restored session waiting for Face ID / fingerprint (SRS 3.1.1.1). */
  isLocked: boolean;
  /** Prompt for biometrics; resolves `true` and unlocks on success. */
  unlock: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves `true` when Supabase asks for email verification first. */
  signUp: (fullName: string, email: string, password: string) => Promise<boolean>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  /** Completes the emailed-code reset and signs the user in. */
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-read the profile, e.g. after onboarding completes. */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(userId: string) {
  const [profileRes, studentRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, college_id, full_name, email, status, avatar_path')
      .eq('id', userId)
      .single(),
    supabase.from('students').select('profile_complete').eq('user_id', userId).maybeSingle(),
  ]);
  if (profileRes.error) throw profileRes.error;
  return {
    profile: profileRes.data,
    profileComplete: studentRes.data?.profile_complete ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  async function syncProfile(next: Session | null) {
    if (!next) {
      setProfile(null);
      setProfileComplete(false);
      return;
    }
    try {
      const loaded = await loadProfile(next.user.id);
      // Suspended accounts are signed out immediately (SRS 3.1.3).
      if (loaded.profile.status === 'suspended') {
        await supabase.auth.signOut();
        return;
      }
      setProfile(loaded.profile);
      setProfileComplete(loaded.profileComplete);
    } catch {
      setProfile(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      // Only sessions restored at launch are locked; a fresh password sign-in is not.
      if (data.session) {
        setIsLocked(await isBiometricEnabled(data.session.user.id).catch(() => false));
      }
      await syncProfile(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Token refreshes don't change who is signed in.
      if (event === 'TOKEN_REFRESHED') return;
      // Defer Supabase calls out of the callback to avoid auth deadlocks.
      setTimeout(() => syncProfile(next), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function unlock() {
    const ok = await authenticateWithBiometrics();
    if (ok) setIsLocked(false);
    return ok;
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    offerBiometricUnlock(data.user.id).catch(() => {});
  }

  async function signUp(fullName: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    if (error) throw error;
    return data.session === null;
  }

  async function verifyEmail(email: string, code: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'email',
    });
    if (error) throw error;
  }

  async function resendVerification(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) throw error;
  }

  async function sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw error;
  }

  async function resetPassword(email: string, code: string, newPassword: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'recovery',
    });
    if (error) throw error;
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) throw updateError;
  }

  async function signOut() {
    setIsLocked(false);
    await supabase.auth.signOut();
  }

  const role = session && profile ? profile.role : null;

  return (
    <AuthContext
      value={{
        session,
        profile,
        role,
        needsOnboarding: role === 'student' && !profileComplete,
        isLoading,
        isLocked: isLocked && role !== null,
        unlock,
        signIn,
        signUp,
        verifyEmail,
        resendVerification,
        sendPasswordReset,
        resetPassword,
        signOut,
        refreshProfile: () => syncProfile(session),
      }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
