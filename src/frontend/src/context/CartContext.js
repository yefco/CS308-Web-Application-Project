import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function clearAuthStorage() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userData');
  localStorage.removeItem('userEmail');
}

function getSessionId() {
  let sid = localStorage.getItem('guest_session_id');
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem('guest_session_id', sid);
  }
  return sid;
}

function cartHeaders() {
  const token = localStorage.getItem('authToken');
  if (token) {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }
  return { 'Content-Type': 'application/json', 'X-Session-ID': getSessionId() };
}

// Save product display info (image, stock) locally so we can show them in cart
function cacheProductInfo(product) {
  const cache = JSON.parse(localStorage.getItem('product_cache') || '{}');
  cache[product.id] = { image: product.image, stock: product.stock, name: product.name };
  localStorage.setItem('product_cache', JSON.stringify(cache));
}

function getProductCache() {
  return JSON.parse(localStorage.getItem('product_cache') || '{}');
}

// Enrich backend cart items with locally cached display info
function enrichItems(backendItems) {
  const cache = getProductCache();
  return backendItems.map(item => ({
    id: item.product_id,
    name: item.product_name,
    price: parseFloat(item.price),
    quantity: item.quantity,
    cartItemId: item.cart_item_id,
    image: cache[item.product_id]?.image || '',
    stock: cache[item.product_id]?.stock ?? 999,
  }));
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const applyItems = useCallback((enriched) => {
    setItems(enriched);
    setCartCount(enriched.reduce((n, i) => n + i.quantity, 0));
    setCartTotal(parseFloat(enriched.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)));
  }, []);

  // Fetch cart from backend
  const fetchCart = useCallback(async () => {
    try {
      let res = await fetch('/api/cart', { headers: cartHeaders() });
      if (res.status === 401) {
        clearAuthStorage();
        res = await fetch('/api/cart', { headers: cartHeaders() });
      }
      if (!res.ok) { applyItems([]); return; }
      const data = await res.json();
      applyItems(enrichItems(data.items ?? []));
    } catch {
      applyItems([]);
    }
  }, [applyItems]);

  // Load cart on mount
  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Add item to cart
  const addItem = useCallback(async (product, quantity = 1) => {
    cacheProductInfo(product);
    try {
      let res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: cartHeaders(),
        body: JSON.stringify({ product_id: product.id, quantity }),
      });
      if (res.status === 401) {
        clearAuthStorage();
        res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: cartHeaders(),
          body: JSON.stringify({ product_id: product.id, quantity }),
        });
      }
      if (!res.ok) return;
      const data = await res.json();
      applyItems(enrichItems(data.items ?? []));
    } catch { /* silent */ }
  }, [applyItems]);

  // Remove item
  const removeItem = useCallback(async (productId) => {
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'DELETE',
        headers: cartHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      applyItems(enrichItems(data.items ?? []));
    } catch { /* silent */ }
  }, [applyItems]);

  // Update quantity
  const updateQuantity = useCallback(async (productId, quantity) => {
    if (quantity <= 0) { removeItem(productId); return; }
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: 'PUT',
        headers: cartHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) return;
      const data = await res.json();
      applyItems(enrichItems(data.items ?? []));
    } catch { /* silent */ }
  }, [applyItems, removeItem]);

  // Clear cart
  const clear = useCallback(async () => {
    try {
      await fetch('/api/cart', { method: 'DELETE', headers: cartHeaders() });
    } catch { /* silent */ }
    applyItems([]);
  }, [applyItems]);

  // Merge guest cart into user cart on login
  const mergeWithUserCart = useCallback(async () => {
    const sessionId = localStorage.getItem('guest_session_id');
    if (sessionId) {
      try {
        await fetch('/api/cart/merge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
        localStorage.removeItem('guest_session_id');
      } catch { /* silent */ }
    }
    await fetchCart();
  }, [fetchCart]);

  const getItem = useCallback((productId) => items.find(i => i.id === productId), [items]);
  const hasItem = useCallback((productId) => items.some(i => i.id === productId), [items]);

  return (
    <CartContext.Provider value={{
      items, cartCount, cartTotal,
      addItem, removeItem, updateQuantity, clear,
      mergeWithUserCart, getItem, hasItem,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
