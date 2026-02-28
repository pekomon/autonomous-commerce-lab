import { formatMoney } from '@autonomous-commerce-lab/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { StorefrontHeader } from '../components/StorefrontHeader';
import { useSupabase } from '../lib/SupabaseContext';
import { fetchMyOrders, toOrderErrorMessage, type OrderSummary } from '../orders/ordersApi';

function formatMinorAmount(amount: number, currency: string): string {
  if (currency === 'EUR' || currency === 'USD') {
    return formatMoney(amount / 100, currency);
  }

  return `${(amount / 100).toFixed(2)} ${currency}`;
}

export function OrdersPage() {
  const { client, configError } = useSupabase();
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      if (!client || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const rows = await fetchMyOrders(client, user.id);

        if (!isMounted) {
          return;
        }

        setOrders(rows);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(toOrderErrorMessage(loadError));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, [client, reloadKey, user]);

  return (
    <div className="storefront-shell">
      <StorefrontHeader subtitle="View your purchase history." title="My Orders" />

      <section>
        {!client ? (
          <ErrorState
            details="Add values to .env.local for local development, or provide public/config.json for runtime deployment config."
            message={configError ?? 'Storefront configuration is missing.'}
            title="Storefront configuration required"
          />
        ) : null}

        {client && loading ? <LoadingState label="Loading orders..." /> : null}

        {client && !loading && error ? (
          <ErrorState
            message={error}
            onRetry={() => setReloadKey((current) => current + 1)}
            retryLabel="Retry"
            title="Unable to load orders"
          />
        ) : null}

        {client && !loading && !error && orders.length === 0 ? (
          <EmptyState
            description="Place your first order from the products page."
            title="You have no orders yet."
          />
        ) : null}

        {client && !loading && !error && orders.length > 0 ? (
          <div className="order-list">
            {orders.map((order) => (
              <article className="order-row" key={order.id}>
                <div>
                  <h3>
                    <Link to={`/orders/${order.id}`}>Order {order.id.slice(0, 8)}</Link>
                  </h3>
                  <p>
                    Status: <strong>{order.status}</strong>
                  </p>
                  <p>{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <p className="product-price">
                  {formatMinorAmount(order.totalAmount, order.currency)}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
