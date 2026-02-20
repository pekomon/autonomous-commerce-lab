import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AdminHeader } from '../components/AdminHeader';
import {
  isOrderStatusConflictError,
  toOrderReadErrorMessage,
  toOrderWriteErrorMessage,
} from '../orders/orderErrors';
import {
  canTransitionOrderStatus,
  formatOrderAmount,
  type AdminOrderDetails,
  type OrderStatus,
} from '../orders/orderMappers';
import { fetchAdminOrderDetails, updateAdminOrderStatus } from '../orders/ordersApi';

export function OrderDetailsPage() {
  const { id } = useParams();

  const [order, setOrder] = useState<AdminOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingTargetStatus, setUpdatingTargetStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrderDetails(orderId: string) {
      setLoading(true);
      setError(null);

      try {
        const details = await fetchAdminOrderDetails(orderId);

        if (!isMounted) {
          return;
        }

        setOrder(details);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(toOrderReadErrorMessage(loadError as { code?: string; message?: string }));
        setOrder(null);
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
  }, [id]);

  async function handleStatusUpdate(nextStatus: OrderStatus) {
    if (!order) {
      return;
    }

    setUpdatingStatus(true);
    setUpdatingTargetStatus(nextStatus);
    setStatusError(null);
    setStatusMessage(null);

    try {
      const updatedStatus = await updateAdminOrderStatus(order.id, order.status, nextStatus);

      setOrder((current) => (current ? { ...current, status: updatedStatus } : current));

      if (updatedStatus !== order.status) {
        setStatusMessage(`Order status updated to ${updatedStatus}.`);
      }
    } catch (updateError) {
      const typedError = updateError as { code?: string; message?: string };
      setStatusError(toOrderWriteErrorMessage(typedError));

      if (isOrderStatusConflictError(typedError) && id) {
        try {
          const refreshed = await fetchAdminOrderDetails(id);
          setOrder(refreshed);
        } catch {
          // Keep the original status error if refresh fails.
        }
      }
    } finally {
      setUpdatingStatus(false);
      setUpdatingTargetStatus(null);
    }
  }

  if (loading) {
    return (
      <div className="app-shell">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <p className="error-message">{error}</p>
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="app-shell">
        <p>Order not found.</p>
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  }

  const canMarkFulfilled = canTransitionOrderStatus(order.status, 'fulfilled');
  const canCancel = canTransitionOrderStatus(order.status, 'cancelled');

  return (
    <div className="app-shell">
      <AdminHeader subtitle="Review order items and update status." title={`Order ${order.id}`} />

      <section className="details-grid">
        <p>
          <strong>Status:</strong> {order.status}
        </p>
        <p>
          <strong>Total:</strong> {formatOrderAmount(order.totalAmount, order.currency)}
        </p>
        <p>
          <strong>Currency:</strong> {order.currency}
        </p>
        <p>
          <strong>User:</strong> {order.userId}
        </p>
        <p>
          <strong>Created:</strong> {new Date(order.createdAt).toLocaleString('en-US')}
        </p>

        <div className="inline-actions">
          <button
            className="primary-button"
            disabled={!canMarkFulfilled || updatingStatus}
            onClick={() => void handleStatusUpdate('fulfilled')}
            type="button"
          >
            {updatingStatus && updatingTargetStatus === 'fulfilled'
              ? 'Updating...'
              : 'Mark fulfilled'}
          </button>
          <button
            className="danger-button"
            disabled={!canCancel || updatingStatus}
            onClick={() => void handleStatusUpdate('cancelled')}
            type="button"
          >
            {updatingStatus && updatingTargetStatus === 'cancelled'
              ? 'Updating...'
              : 'Cancel order'}
          </button>
        </div>

        {statusMessage ? <p className="success-message">{statusMessage}</p> : null}
        {statusError ? <p className="error-message">{statusError}</p> : null}
      </section>

      <section>
        <h2>Order items</h2>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Line total</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {order.items.length === 0 ? (
              <tr>
                <td className="empty-state" colSpan={5}>
                  No items found for this order.
                </td>
              </tr>
            ) : (
              order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productTitle}</td>
                  <td>{item.quantity}</td>
                  <td>{formatOrderAmount(item.unitPriceAmount, order.currency)}</td>
                  <td>{formatOrderAmount(item.lineTotalAmount, order.currency)}</td>
                  <td>{new Date(item.createdAt).toLocaleString('en-US')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Link to="/orders">Back to orders</Link>
    </div>
  );
}
