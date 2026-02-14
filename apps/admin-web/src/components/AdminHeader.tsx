import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';

interface AdminHeaderProps {
  title: string;
  subtitle: string;
}

export function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { signOut } = useAuth();

  return (
    <header>
      <div className="top-row">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <button className="secondary-button" onClick={() => void signOut()} type="button">
          Sign out
        </button>
      </div>

      <nav className="page-nav">
        <Link to="/products">Products</Link>
        <Link to="/products/new">Create Product</Link>
      </nav>
    </header>
  );
}
