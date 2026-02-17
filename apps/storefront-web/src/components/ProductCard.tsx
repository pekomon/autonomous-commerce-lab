import { formatMoney } from '@autonomous-commerce-lab/shared';
import { Link } from 'react-router-dom';

import type { StorefrontProductCard } from '../data/storefrontApi';

interface ProductCardProps {
  product: StorefrontProductCard;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <Link className="product-image-link" to={`/products/${product.id}`}>
        {product.thumbnailUrl ? (
          <img alt={product.title} src={product.thumbnailUrl} />
        ) : (
          <div className="image-placeholder">No image</div>
        )}
      </Link>

      <div className="product-card-content">
        <h3>
          <Link to={`/products/${product.id}`}>{product.title}</Link>
        </h3>

        <p className="product-price">{formatMoney(product.price, product.currency)}</p>

        {product.categoryNames.length > 0 ? (
          <div className="badge-row">
            {product.categoryNames.map((categoryName) => (
              <span className="category-badge" key={categoryName}>
                {categoryName}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
