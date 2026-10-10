import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

/**
 * Where Supabase sends the browser back after Google: the app's root
 * (collappmobile://). Add `collappmobile://**` to Supabase Auth's redirect URLs.
 */
const redirectTo = Linking.createURL('');

/** key=value pairs from both the query string and the #fragment of a redirect URL. */
function redirectParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [beforeHash, hash = ''] = url.split('#');
  const query = beforeHash.split('?')[1] ?? '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [key, value = ''] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  }
  return params;
}

/**
 * Sign in with Google in an in-app browser (SRS 3.1.1.1). New Google users get
 * a student account from the sign-up trigger. Resolves the user id, or null
 * when the person closes the browser.
 */
export async function signInWithGoogleOAuth(): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // Always show the account chooser so shared phones don't reuse someone else's account.
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null;

  const params = redirectParams(result.url);
  if (params.error || params.error_description) {
    throw new Error(params.error_description || params.error);
  }
  // PKCE returns a code; the implicit flow (this client's default) returns tokens.
  if (params.code) {
    const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      params.code,
    );
    if (exchangeError) throw exchangeError;
    return exchanged.user.id;
  }
  if (params.access_token && params.refresh_token) {
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;
    return session.user?.id ?? null;
  }
  throw new Error('Google sign-in did not return a session. Please try again.');
}
