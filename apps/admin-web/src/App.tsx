import { Navigate, Route, Routes } from 'react-router-dom';

import { useAuth } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductsListPage } from './pages/ProductsListPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { OrdersListPage } from './pages/OrdersListPage';

function HomeRoute() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <p>Checking authentication session...</p>
      </div>
    );
  }

  return <Navigate replace to={user ? '/products' : '/login'} />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<HomeRoute />} path="/" />
      <Route element={<LoginPage />} path="/login" />

      <Route element={<ProtectedRoute />}>
        <Route element={<ProductsListPage />} path="/products" />
        <Route element={<ProductFormPage />} path="/products/new" />
        <Route element={<ProductDetailsPage />} path="/products/:id" />
        <Route element={<ProductFormPage />} path="/products/:id/edit" />
        <Route element={<CategoriesPage />} path="/categories" />
        <Route element={<OrdersListPage />} path="/orders" />
        <Route element={<OrderDetailsPage />} path="/orders/:id" />
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
