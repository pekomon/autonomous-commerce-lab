import { formatMoney, type Product } from '@autonomous-commerce-lab/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AdminHeader } from '../components/AdminHeader';
import { ProductImagesManager } from '../components/ProductImagesManager';
import { supabase } from '../lib/supabaseClient';
import { toProductWriteErrorMessage } from '../products/productErrors';
import { mapDbRowToProduct, type ProductDbRow } from '../products/productMappers';

const PRODUCT_SELECT =
  'id,title,description,price_amount,currency,status,tags,created_at,updated_at';

export function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('id', id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (fetchError) {
        setError('Failed to load product details.');
        setProduct(null);
      } else if (!data) {
        setProduct(null);
      } else {
        setProduct(mapDbRowToProduct(data as ProductDbRow));
      }

      setLoading(false);
    }

    if (id) {
      void loadProduct();
    } else {
      setLoading(false);
      setProduct(null);
      setError('Invalid product id.');
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleArchive() {
    if (!id) {
      return;
    }

    setArchiving(true);
    setArchiveError(null);

    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'archived' })
      .eq('id', id);

    if (updateError) {
      setArchiveError(toProductWriteErrorMessage(updateError));
    } else {
      setProduct((current) => (current ? { ...current, status: 'archived' } : current));
    }

    setArchiving(false);
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <p className="error-message">{error}</p>
        <Link to="/products">Back to products</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="app-shell">
        <p>Product not found.</p>
        <Link to="/products">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AdminHeader subtitle="Product details from Supabase." title={product.title} />

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
          <strong>Tags:</strong> {product.tags.join(', ') || 'None'}
        </p>
        <p>
          <strong>Description:</strong> {product.description}
        </p>

        <div className="inline-actions">
          <Link className="secondary-button" to={`/products/${product.id}/edit`}>
            Edit
          </Link>
          <button
            className="danger-button"
            disabled={archiving || product.status === 'archived'}
            onClick={() => void handleArchive()}
            type="button"
          >
            {archiving ? 'Archiving...' : 'Archive'}
          </button>
        </div>

        {archiveError ? <p className="error-message">{archiveError}</p> : null}
      </section>

      <ProductImagesManager allowManage={false} productId={product.id} />

      <Link to="/products">Back to products</Link>
    </div>
  );
}
