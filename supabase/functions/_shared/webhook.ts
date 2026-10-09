import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/**
 * Database-triggered calls (private.call_edge) carry a secret generated inside
 * Vault. These functions deploy with verify_jwt off and check it here instead.
 */
export async function isFromDatabase(req: Request, admin: SupabaseClient): Promise<boolean> {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret) return false;
  const { data, error } = await admin.rpc('verify_webhook_secret', { p_secret: secret });
  return !error && data === true;
}
