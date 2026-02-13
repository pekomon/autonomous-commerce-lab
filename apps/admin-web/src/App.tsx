import { Navigate, Route, Routes } from 'react-router-dom';

import { ProductDetailsPage } from './pages/ProductDetailsPage';
import { ProductsListPage } from './pages/ProductsListPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<ProductsListPage />} />
      <Route path="/products/:id" element={<ProductDetailsPage />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
