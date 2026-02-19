import { FormEvent, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { StorefrontHeader } from '../components/StorefrontHeader';
import { useAuth } from '../auth/AuthProvider';

type AuthMode = 'signIn' | 'signUp';

export function LoginPage() {
  const { user, signInWithPassword, signUpWithPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('next') || '/products';
  }, [location.search]);

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) {
    return <Navigate replace to={nextPath} />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signIn') {
        const signInError = await signInWithPassword(email, password);

        if (signInError) {
          setError(signInError);
          return;
        }

        navigate(nextPath, { replace: true });
        return;
      }

      const signUpError = await signUpWithPassword(email, password);

      if (signUpError) {
        setError(signUpError);
      } else {
        setMessage('Sign-up submitted. Check your email for confirmation if required.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="storefront-shell">
      <StorefrontHeader
        subtitle="Sign in to place orders and view your order history."
        title="Customer Login"
      />

      <section className="auth-card">
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
