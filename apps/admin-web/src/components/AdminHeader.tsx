import { Link } from 'react-router-dom';
import { useState } from 'react';

import { useAuth } from '../auth/AuthProvider';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSignOutError(null);

    const error = await signOut();
    if (error) {
      setSignOutError(error);
    }
  }

  return (
    <header>
      <div className="top-row">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          {signOutError ? <p className="error-message">{signOutError}</p> : null}
        </div>

        <button className="secondary-button" onClick={() => void handleSignOut()} type="button">
          Sign out
        </button>
      </div>

      <nav className="page-nav">
        <Link to="/products">Products</Link>
        <Link to="/products/new">Create Product</Link>
        <Link to="/categories">Categories</Link>
      </nav>
    </header>
  );
}
