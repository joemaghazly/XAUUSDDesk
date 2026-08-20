import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';

export function Login() {
  const { signInWithEmail, configured } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signInWithEmail(email.trim());
    setBusy(false);
    if (res.error) setError(res.error);
    else setSent(true);
  }

  return (
    <div className="authwrap">
      <div className="authcard">
        <div className="eye" style={{ marginBottom: 6 }}>The Desk</div>
        <h2 style={{ marginBottom: 20 }}>Sign in</h2>
        {!configured && (
          <div className="note bad">Supabase isn't configured in this environment yet — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.</div>
        )}
        {sent ? (
          <div className="note ok">Check your inbox for a sign-in link.</div>
        ) : (
          <form onSubmit={onSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={!configured}
            />
            {error && <div className="note bad">{error}</div>}
            <button className="btn" type="submit" disabled={!configured || busy} style={{ marginTop: 6, width: '100%' }}>
              {busy ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
