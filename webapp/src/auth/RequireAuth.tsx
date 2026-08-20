import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { Login } from './Login';

// When Supabase isn't configured (no env vars set), we let the app render
// so the UI can be built/verified locally without live credentials. Once
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, this becomes a real
// gate: no session -> Login screen.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading, configured } = useAuth();

  if (!configured) return <>{children}</>;
  if (loading) return null;
  if (!session) return <Login />;
  return <>{children}</>;
}
