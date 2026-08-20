import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

// Falls back to a harmless placeholder project so importing this module
// never throws when env vars aren't set yet (e.g. first local run before
// `.env.local` is created). Callers should check `supabaseConfigured`
// before relying on auth/data calls succeeding.
export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
);
