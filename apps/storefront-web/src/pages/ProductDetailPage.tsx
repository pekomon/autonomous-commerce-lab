import { formatMoney, type Category, type Product } from '@autonomous-commerce-lab/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useCart } from '../cart/CartProvider';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StorefrontHeader } from '../components/StorefrontHeader';
import {
  fetchCategories,
  fetchProductById,
  fetchProductCategoryIds,
  fetchProductImages,
  type ProductImageItem,
} from '../data/storefrontApi';
import { useSupabase } from '../lib/SupabaseContext';

export function ProductDetailPage() {
  const { id } = useParams();
  const { client, configError } = useSupabase();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadProductDetails(productId: string) {
      if (!client) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [productRow, imageRows, categoryIds, allCategories] = await Promise.all([
          fetchProductById(client, productId),
          fetchProductImages(client, productId),
          fetchProductCategoryIds(client, productId),
          fetchCategories(client),
        ]);

        if (!isMounted) {
          return;
        }

        setProduct(productRow);
        setImages(imageRows);
        setCategories(allCategories.filter((category) => categoryIds.includes(category.id)));
        setActiveImageIndex(0);
      } catch {
        if (!isMounted) {
          return;
        }

        setError('Unable to load product details. Please try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (!id) {
      setError('Invalid product id.');
      setLoading(false);
      return;
    }

    void loadProductDetails(id);

    return () => {
      isMounted = false;
    };
  }, [client, id, reloadKey]);

  const activeImage = useMemo(() => images[activeImageIndex] ?? null, [activeImageIndex, images]);

  if (!client) {
    return (
      <div className="storefront-shell">
        <StorefrontHeader subtitle="Public product detail from Supabase." title="Product Detail" />

        <section>
          <ErrorState
            details="Add values to .env.local for local development, or provide public/config.json for runtime deployment config."
            message={configError ?? 'Storefront configuration is missing.'}
            title="Storefront configuration required"
          />
        </section>

        <Link to="/products">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="storefront-shell">
      <StorefrontHeader subtitle="Public product detail from Supabase." title="Product Detail" />

      {loading ? <LoadingState label="Loading product details..." /> : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((current) => current + 1)}
          retryLabel="Retry"
          title="Unable to load product"
        />
      ) : null}

      {!loading && !error && !product ? (
        <EmptyState
          description="The product may have been removed or is no longer available."
          title="Product not found."
        />
      ) : null}

      {!loading && !error && product ? (
        <section className="detail-layout">
          <div>
            {activeImage ? (
              <img alt={product.title} className="main-image" src={activeImage.publicUrl} />
            ) : (
              <div className="image-placeholder main-image">No image available</div>
            )}

            {images.length > 1 ? (
              <div className="thumb-row">
                {images.map((image, index) => (
                  <button
                    className={`thumb-button ${index === activeImageIndex ? 'active' : ''}`}
                    key={image.id}
                    onClick={() => setActiveImageIndex(index)}
                    type="button"
                  >
                    <img alt={`${product.title} thumbnail ${index + 1}`} src={image.publicUrl} />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h2>{product.title}</h2>
            <p className="product-price">{formatMoney(product.price, product.currency)}</p>
            <p>{product.description}</p>

            {categories.length > 0 ? (
              <div className="badge-row">
                {categories.map((category) => (
                  <span className="category-badge" key={category.id}>
                    {category.name}
                  </span>
                ))}
              </div>
            ) : null}

            <p>
              <strong>Tags:</strong> {product.tags.join(', ') || 'None'}
            </p>

            <div className="action-row">
              <button
                className="primary-button"
                onClick={() => {
                  addItem(product.id, 1);
                  setCartMessage('Product added to cart.');
                }}
                type="button"
              >
                Add to cart
              </button>
              <Link to="/cart">View cart</Link>
            </div>

            {cartMessage ? <p className="success-message">{cartMessage}</p> : null}
          </div>
        </section>
      ) : null}

      <Link to="/products">Back to products</Link>
    </div>
  );
}
