import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './AuthProvider';

export function ProtectedRoute() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <p>Checking authentication session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
