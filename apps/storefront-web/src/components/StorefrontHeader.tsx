import { Link, NavLink } from 'react-router-dom';

interface StorefrontHeaderProps {
  title: string;
  subtitle: string;
}

export function StorefrontHeader({ title, subtitle }: StorefrontHeaderProps) {
  return (
    <header className="storefront-header">
      <div>
        <Link className="brand-link" to="/">
          Autonomous Commerce Storefront
        </Link>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <nav className="header-nav">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">Browse Products</NavLink>
      </nav>
    </header>
  );
}
