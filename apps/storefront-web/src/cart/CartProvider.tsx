import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  deserializeCartItems,
  normalizeCartItems,
  serializeCartItems,
  type CartItem,
} from './cartHelpers';

const CART_STORAGE_KEY = 'storefront_cart_v1';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readItemsFromStorage(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  return deserializeCartItems(window.localStorage.getItem(CART_STORAGE_KEY));
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => readItemsFromStorage());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, serializeCartItems(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem: (productId, quantity = 1) => {
        setItems((current) => normalizeCartItems([...current, { productId, quantity }]));
      },
      setQuantity: (productId, quantity) => {
        setItems((current) => {
          const withoutTarget = current.filter((item) => item.productId !== productId);

          if (quantity <= 0) {
            return withoutTarget;
          }

          return normalizeCartItems([...withoutTarget, { productId, quantity }]);
        });
      },
      removeItem: (productId) => {
        setItems((current) => current.filter((item) => item.productId !== productId));
      },
      clear: () => {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }

  return context;
}
