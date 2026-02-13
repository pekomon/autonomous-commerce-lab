import { formatMoney } from '@autonomous-commerce-lab/shared';
import { Link, useParams } from 'react-router-dom';

import { mockProducts } from '../mockProducts';

export function ProductDetailsPage() {
  const { id } = useParams();
  const product = mockProducts.find((item) => item.id === id);

  if (!product) {
    return (
      <div className="app-shell">
        <header>
          <h1>Product Not Found</h1>
          <p>The requested product does not exist in mock data.</p>
        </header>
        <Link to="/products">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header>
        <h1>{product.title}</h1>
        <p>Product details view for admin catalog.</p>
      </header>

      <section className="details-grid">
        <p>
          <strong>Status:</strong> {product.status}
        </p>
        <p>
          <strong>Price:</strong> {formatMoney(product.price, product.currency)}
        </p>
        <p>
          <strong>Created:</strong> {new Date(product.createdAt).toLocaleString('en-US')}
        </p>
        <p>
          <strong>Tags:</strong> {product.tags.join(', ')}
        </p>
        <p>
          <strong>Description:</strong> {product.description}
        </p>
      </section>

      <Link to="/products">Back to products</Link>
    </div>
  );
}
