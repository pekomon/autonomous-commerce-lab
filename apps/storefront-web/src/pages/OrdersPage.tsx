import { formatMoney } from '@autonomous-commerce-lab/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
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
  }, [client, user]);

  return (
    <div className="storefront-shell">
      <StorefrontHeader subtitle="View your purchase history." title="My Orders" />

      <section>
        {!client ? (
          <p className="error-message">{configError ?? 'Storefront configuration is missing.'}</p>
        ) : null}
        {loading ? <p>Loading orders...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {!loading && !error && orders.length === 0 ? <p>You have no orders yet.</p> : null}

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
      </section>
    </div>
  );
}
