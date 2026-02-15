import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';

type AuthMode = 'signIn' | 'signUp';

export function LoginPage() {
  const { user, signInWithPassword, signUpWithPassword } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/products" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    if (mode === 'signIn') {
      const signInError = await signInWithPassword(email, password);

      if (signInError) {
        setError(signInError);
      }
    } else {
      const signUpError = await signUpWithPassword(email, password);

      if (signUpError) {
        setError(signUpError);
      } else {
        setMessage('Sign-up request submitted. Check your email for confirmation if required.');
      }
    }

    setSubmitting(false);
  }

  return (
    <div className="app-shell auth-shell">
      <section className="auth-card">
        <h1>Admin Login</h1>
        <p>Authenticate with Supabase to access product management.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            Password
            <input
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="error-message">{error}</p> : null}
          {message ? <p className="success-message">{message}</p> : null}

          <button className="primary-button" disabled={submitting} type="submit">
            {submitting ? 'Submitting...' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          className="text-button"
          onClick={() => setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'))}
          type="button"
        >
          {mode === 'signIn' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
        </button>
      </section>
    </div>
  );
}
