import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './auth/ProtectedRoute';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { OrderDetailsPage } from './pages/OrderDetailsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<ProductsPage />} path="/products" />
      <Route element={<ProductDetailPage />} path="/products/:id" />
      <Route element={<CartPage />} path="/cart" />

      <Route element={<ProtectedRoute />}>
        <Route element={<OrdersPage />} path="/orders" />
        <Route element={<OrderDetailsPage />} path="/orders/:id" />
      </Route>

      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
