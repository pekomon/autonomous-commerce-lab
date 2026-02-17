import { Navigate, Route, Routes } from 'react-router-dom';

import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { ProductsPage } from './pages/ProductsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<ProductsPage />} path="/products" />
      <Route element={<ProductDetailPage />} path="/products/:id" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  );
}
