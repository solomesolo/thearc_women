/**
 * Shared Supabase client for engine pipeline DB access.
 * Uses service role key so engine reads/writes bypass RLS.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getEngineSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required for engine');
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
