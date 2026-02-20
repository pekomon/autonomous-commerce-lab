import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AdminHeader } from '../components/AdminHeader';
import { toOrderReadErrorMessage } from '../orders/orderErrors';
import { filterOrdersByStatus } from '../orders/orderLogic';
import {
  formatOrderAmount,
  type AdminOrderSummary,
  type OrderStatusFilter,
} from '../orders/orderMappers';
import { fetchAdminOrders } from '../orders/ordersApi';

const STATUS_OPTIONS: ReadonlyArray<{ value: OrderStatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'cancelled', label: 'Cancelled' },
];

function isOrderStatusFilter(value: string): value is OrderStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

function shortenUserId(userId: string): string {
  if (userId.length <= 12) {
    return userId;
  }

  return `${userId.slice(0, 8)}...`;
}

export function OrdersListPage() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [status, setStatus] = useState<OrderStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const loadedOrders = await fetchAdminOrders();

        if (!isMounted) {
          return;
        }

        setOrders(loadedOrders);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setOrders([]);
        setError(toOrderReadErrorMessage(loadError as { code?: string; message?: string }));
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
  }, []);

  const visibleOrders = useMemo(() => {
    return filterOrdersByStatus(orders, status);
  }, [orders, status]);

  return (
    <div className="app-shell">
      <AdminHeader subtitle="Review and manage order statuses." title="Orders" />

      <section>
        <div className="controls">
          <label>
            Status
            <select
              onChange={(event) => {
                const value = event.target.value;
                if (isOrderStatusFilter(value)) {
                  setStatus(value);
                }
              }}
              value={status}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? <p>Loading orders...</p> : null}
        {error ? <p className="error-message">{error}</p> : null}

        {!loading && !error ? (
          <p className="results-count">{visibleOrders.length} order(s) found</p>
        ) : null}

        {!loading && !error ? (
          <table>
            <thead>
              <tr>
                <th>Created</th>
                <th>Status</th>
                <th>Total</th>
                <th>Currency</th>
                <th>User</th>
                <th>Items</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length === 0 ? (
                <tr>
                  <td className="empty-state" colSpan={7}>
                    No orders match the current filter.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.createdAt).toLocaleString('en-US')}</td>
                    <td>{order.status}</td>
                    <td>{formatOrderAmount(order.totalAmount, order.currency)}</td>
                    <td>{order.currency}</td>
                    <td title={order.userId}>{shortenUserId(order.userId)}</td>
                    <td>{order.itemCount}</td>
                    <td>
                      <Link to={`/orders/${order.id}`}>View</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
