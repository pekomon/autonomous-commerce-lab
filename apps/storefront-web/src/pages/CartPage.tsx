import { formatMoney } from '@autonomous-commerce-lab/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthProvider';
import { calculateCartTotalAmount, type CheckoutProductSnapshot } from '../cart/cartHelpers';
import { useCart } from '../cart/CartProvider';
import { StorefrontHeader } from '../components/StorefrontHeader';
import { useSupabase } from '../lib/SupabaseContext';
import {
  createOrderFromCart,
  fetchCheckoutProducts,
  toOrderErrorMessage,
} from '../orders/ordersApi';

function formatMinorAmount(amount: number, currency: string): string {
  if (currency === 'EUR' || currency === 'USD') {
    return formatMoney(amount / 100, currency);
  }

  return `${(amount / 100).toFixed(2)} ${currency}`;
}

export function CartPage() {
  const { client, configError } = useSupabase();
  const { user } = useAuth();
  const { items, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<CheckoutProductSnapshot[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      if (!client) {
        setLoadingProducts(false);
        setProducts([]);
        return;
      }

      if (items.length === 0) {
        setLoadingProducts(false);
        setProducts([]);
        setProductsError(null);
        return;
      }

      setLoadingProducts(true);
      setProductsError(null);

      try {
        const snapshots = await fetchCheckoutProducts(
          client,
          items.map((item) => item.productId),
        );

        if (!isMounted) {
          return;
        }

        setProducts(snapshots);
      } catch {
        if (!isMounted) {
          return;
        }

        setProducts([]);
        setProductsError('Unable to load cart products. Please refresh and try again.');
      } finally {
        if (isMounted) {
          setLoadingProducts(false);
        }
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, [client, items]);

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const unavailableItems = useMemo(() => {
    return items.filter((item) => {
      const product = productsById.get(item.productId);
      return !product || product.status !== 'active';
    });
  }, [items, productsById]);

  const currencies = useMemo(() => {
    const activeCurrencies = new Set<string>();

    for (const item of items) {
      const product = productsById.get(item.productId);

      if (product?.status === 'active') {
        activeCurrencies.add(product.currency);
      }
    }

    return Array.from(activeCurrencies);
  }, [items, productsById]);

  const totalAmount = useMemo(() => {
    return calculateCartTotalAmount(items, productsById);
  }, [items, productsById]);

  const totalLabel = useMemo(() => {
    if (currencies.length !== 1) {
      return 'Mixed currencies';
    }

    return formatMinorAmount(totalAmount, currencies[0]);
  }, [currencies, totalAmount]);

  async function handleCheckout() {
    setCheckoutError(null);

    if (!client) {
      setCheckoutError(configError ?? 'Storefront configuration is missing.');
      return;
    }

    if (!user) {
      const next = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?next=${next}`);
      return;
    }

    if (items.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    setCheckoutSubmitting(true);

    try {
      const orderId = await createOrderFromCart(client, user.id, items);
      clear();
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (error) {
      setCheckoutError(toOrderErrorMessage(error));
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  const checkoutDisabled =
    checkoutSubmitting ||
    loadingProducts ||
    items.length === 0 ||
    unavailableItems.length > 0 ||
    currencies.length !== 1;

  return (
    <div className="storefront-shell">
      <StorefrontHeader subtitle="Review cart items and continue to checkout." title="Your Cart" />

      <section>
        {items.length === 0 ? <p>Your cart is empty. Add products from the catalog.</p> : null}

        {loadingProducts ? <p>Loading cart products...</p> : null}
        {productsError ? <p className="error-message">{productsError}</p> : null}

        {unavailableItems.length > 0 ? (
          <p className="error-message">
            Some items are no longer available for checkout. Remove them before continuing.
          </p>
        ) : null}

        {currencies.length > 1 ? (
          <p className="error-message">
            Cart items have mixed currencies. Keep only one currency to checkout.
          </p>
        ) : null}

        {checkoutError ? <p className="error-message">{checkoutError}</p> : null}

        {items.length > 0 ? (
          <div className="cart-list">
            {items.map((item) => {
              const product = productsById.get(item.productId);
              const lineTotal = product
                ? formatMinorAmount(product.priceAmount * item.quantity, product.currency)
                : '-';

              return (
                <article className="cart-row" key={item.productId}>
                  <div>
                    <h3>{product?.title ?? `Product ${item.productId}`}</h3>
                    <p>
                      {product
                        ? formatMinorAmount(product.priceAmount, product.currency)
                        : 'Unavailable'}
                    </p>
                  </div>

                  <label>
                    Quantity
                    <input
                      min={1}
                      onChange={(event) => {
                        const nextQuantity = Number.parseInt(event.target.value, 10);
                        if (Number.isNaN(nextQuantity)) {
                          return;
                        }

                        setQuantity(item.productId, nextQuantity);
                      }}
                      type="number"
                      value={item.quantity}
                    />
                  </label>

                  <div>
                    <p>Line total</p>
                    <strong>{lineTotal}</strong>
                  </div>

                  <button onClick={() => removeItem(item.productId)} type="button">
                    Remove
                  </button>
                </article>
              );
            })}
          </div>
        ) : null}

        <div className="cart-footer">
          <p>
            <strong>Total:</strong> {totalLabel}
          </p>

          <div className="action-row">
            <Link to="/products">Continue shopping</Link>
            <button disabled={checkoutDisabled} onClick={() => void handleCheckout()} type="button">
              {checkoutSubmitting ? 'Placing order...' : 'Checkout'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
