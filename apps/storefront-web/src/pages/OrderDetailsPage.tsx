import { formatMoney } from '@autonomous-commerce-lab/shared';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { StorefrontHeader } from '../components/StorefrontHeader';
import { useSupabase } from '../lib/SupabaseContext';
import { fetchMyOrderDetails, toOrderErrorMessage, type OrderDetails } from '../orders/ordersApi';

function formatMinorAmount(amount: number, currency: string): string {
  if (currency === 'EUR' || currency === 'USD') {
    return formatMoney(amount / 100, currency);
  }

  return `${(amount / 100).toFixed(2)} ${currency}`;
}

export function OrderDetailsPage() {
  const { id } = useParams();
  const { client, configError } = useSupabase();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDetails(orderId: string) {
      if (!client || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const details = await fetchMyOrderDetails(client, user.id, orderId);

        if (!isMounted) {
          return;
        }

        setOrder(details);
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

    if (!id) {
      setLoading(false);
      setError('Invalid order id.');
      return;
    }

    void loadOrderDetails(id);

    return () => {
      isMounted = false;
    };
  }, [client, id, user]);

  return (
    <div className="storefront-shell">
      <StorefrontHeader subtitle="Order confirmation and details." title="Order Details" />

      <section>
        {!client ? (
          <p className="error-message">{configError ?? 'Storefront configuration is missing.'}</p>
        ) : null}
        {loading ? <p>Loading order...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {!loading && !error && !order ? <p>Order not found.</p> : null}

        {!loading && !error && order ? (
          <>
            <p>
              <strong>Order ID:</strong> {order.id}
            </p>
            <p>
              <strong>Status:</strong> {order.status}
            </p>
            <p>
              <strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Total:</strong> {formatMinorAmount(order.totalAmount, order.currency)}
            </p>

            <h3>Items</h3>
            <div className="order-items-list">
              {order.items.map((item) => (
                <article className="order-item-row" key={item.id}>
                  <div>
                    <p>
                      <strong>{item.productTitle}</strong>
                    </p>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <div>
                    <p>{formatMinorAmount(item.unitPriceAmount, order.currency)} each</p>
                    <p>
                      <strong>{formatMinorAmount(item.lineTotalAmount, order.currency)}</strong>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : null}

        <div className="action-row">
          <Link to="/orders">Back to my orders</Link>
          <Link to="/products">Continue shopping</Link>
        </div>
      </section>
    </div>
  );
}
