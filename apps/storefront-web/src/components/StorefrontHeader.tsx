import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { useCart } from '../cart/CartProvider';

interface StorefrontHeaderProps {
  title: string;
  subtitle: string;
}

export function StorefrontHeader({ title, subtitle }: StorefrontHeaderProps) {
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const [signOutError, setSignOutError] = useState<string | null>(null);

  async function handleSignOut() {
    setSignOutError(null);
    const errorMessage = await signOut();

    if (errorMessage) {
      setSignOutError(errorMessage);
    }
  }

  return (
    <header className="storefront-header">
      <div>
        <Link className="brand-link" to="/">
          Autonomous Commerce Storefront
        </Link>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {user ? <p className="session-info">Signed in as {user.email ?? user.id}</p> : null}
        {signOutError ? <p className="error-message">{signOutError}</p> : null}
      </div>

      <nav className="header-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Browse Products</NavLink>
        <NavLink to="/cart">Cart ({itemCount})</NavLink>
        {user ? <NavLink to="/orders">My Orders</NavLink> : <NavLink to="/login">Login</NavLink>}
        {user ? (
          <button className="text-button" onClick={() => void handleSignOut()} type="button">
            Sign out
          </button>
        ) : null}
      </nav>
    </header>
  );
}
