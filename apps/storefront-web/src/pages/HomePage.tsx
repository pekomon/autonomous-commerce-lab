import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ProductCard } from '../components/ProductCard';
import { StorefrontHeader } from '../components/StorefrontHeader';
import { fetchProducts, type StorefrontProductCard } from '../data/storefrontApi';
import { useSupabase } from '../lib/SupabaseContext';

export function HomePage() {
  const { client, configError } = useSupabase();
  const [products, setProducts] = useState<StorefrontProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedProducts() {
      if (!client) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const newestProducts = await fetchProducts(client, {
          query: '',
          categoryId: 'all',
          sort: 'newest',
        });

        if (!isMounted) {
          return;
        }

        setProducts(newestProducts.slice(0, 6));
      } catch {
        if (!isMounted) {
          return;
        }

        setError('Unable to load featured products. Please try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadFeaturedProducts();

    return () => {
      isMounted = false;
    };
  }, [client]);

  return (
    <div className="storefront-shell">
      <StorefrontHeader
        subtitle="Discover active products from the public catalog."
        title="Featured Products"
      />

      {configError ? (
        <section>
          <p className="error-message">{configError}</p>
          <p>
            Add values to <code>.env.local</code> for local development, or provide
            <code> public/config.json</code> for runtime deployment config.
          </p>
        </section>
      ) : null}

      <section>
        <div className="section-row">
          <h2>Latest arrivals</h2>
          <Link to="/products">View all products</Link>
        </div>

        {loading ? <p>Loading featured products...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {!loading && !error && products.length === 0 ? <p>No products available yet.</p> : null}

        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
