/**
 * Frontend unit tests — pure utility logic only.
 *
 * react-scripts@5 Jest cannot resolve react-router-dom v7's package exports field,
 * so rendering App directly fails. These tests validate cart and token utilities
 * without requiring any DOM rendering.
 *
 * Run:  npm test  (inside src/frontend/)
 */

import {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  getCartCount,
  getCartTotal,
  validateCart,
  clearCart,
} from './utils/cartUtils';

// ── helpers ────────────────────────────────────────────────────────────────

/** Mirrors isTokenValid from App.jsx (not exported, so we replicate it). */
function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Build a minimal JWT with the given exp timestamp. */
function fakeJwt(exp) {
  const header  = btoa(JSON.stringify({ alg: 'HS256' }));
  const payload = btoa(JSON.stringify({ sub: '1', exp }));
  return `${header}.${payload}.sig`;
}

beforeEach(() => {
  clearCart();
  localStorage.clear();
});

// ── Token validation ───────────────────────────────────────────────────────

describe('isTokenValid', () => {
  test('returns false for null / empty token', () => {
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid('')).toBe(false);
  });

  test('returns false for a malformed token string', () => {
    expect(isTokenValid('not.a.token')).toBe(false);
  });

  test('returns false for an expired token', () => {
    const expiredExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    expect(isTokenValid(fakeJwt(expiredExp))).toBe(false);
  });

  test('returns true for a valid future-expiry token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour ahead
    expect(isTokenValid(fakeJwt(futureExp))).toBe(true);
  });
});

// ── Cart utilities ─────────────────────────────────────────────────────────

const PRODUCT_A = { id: 1, name: 'MacBook Pro', price: 1999.0, stock: 5 };
const PRODUCT_B = { id: 2, name: 'AirPods Pro',  price: 249.0,  stock: 10 };

describe('addToCart', () => {
  test('adds a new product to an empty cart', () => {
    const cart = addToCart(PRODUCT_A, 1);
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe(1);
    expect(cart[0].quantity).toBe(1);
  });

  test('increments quantity if the product is already in the cart', () => {
    addToCart(PRODUCT_A, 1);
    const cart = addToCart(PRODUCT_A, 2);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);
  });

  test('adds multiple distinct products', () => {
    addToCart(PRODUCT_A, 1);
    const cart = addToCart(PRODUCT_B, 2);
    expect(cart).toHaveLength(2);
  });
});

describe('removeFromCart', () => {
  test('removes the specified product', () => {
    addToCart(PRODUCT_A, 1);
    addToCart(PRODUCT_B, 1);
    const cart = removeFromCart(PRODUCT_A.id);
    expect(cart).toHaveLength(1);
    expect(cart[0].id).toBe(PRODUCT_B.id);
  });

  test('removing a non-existent product leaves cart unchanged', () => {
    addToCart(PRODUCT_A, 2);
    const cart = removeFromCart(999);
    expect(cart).toHaveLength(1);
  });
});

describe('updateCartQuantity', () => {
  test('updates quantity of an existing item', () => {
    addToCart(PRODUCT_A, 1);
    const cart = updateCartQuantity(PRODUCT_A.id, 5);
    expect(cart[0].quantity).toBe(5);
  });

  test('removes item when quantity is set to 0', () => {
    addToCart(PRODUCT_A, 3);
    const cart = updateCartQuantity(PRODUCT_A.id, 0);
    expect(cart).toHaveLength(0);
  });
});

describe('getCartCount', () => {
  test('returns 0 for empty cart', () => {
    expect(getCartCount()).toBe(0);
  });

  test('sums quantities across all items', () => {
    addToCart(PRODUCT_A, 2);
    addToCart(PRODUCT_B, 3);
    expect(getCartCount()).toBe(5);
  });
});

describe('getCartTotal', () => {
  test('returns 0 for empty cart', () => {
    expect(getCartTotal()).toBe(0);
  });

  test('calculates total correctly for multiple items', () => {
    addToCart(PRODUCT_A, 1); // 1999.0
    addToCart(PRODUCT_B, 2); // 498.0
    expect(getCartTotal()).toBeCloseTo(2497.0, 2);
  });
});

describe('validateCart — out-of-stock prevention (Req 3)', () => {
  const products = [
    { id: 1, stock: 5 },
    { id: 2, stock: 0 },
  ];

  test('valid cart passes validation', () => {
    addToCart(PRODUCT_A, 1);
    const { isValid } = validateCart(products);
    expect(isValid).toBe(true);
  });

  test('cart with quantity exceeding stock fails validation', () => {
    addToCart(PRODUCT_A, 10); // stock is only 5
    const { isValid, errors } = validateCart(products);
    expect(isValid).toBe(false);
    expect(errors[0].type).toBe('stock');
  });

  test('cart with product no longer available fails validation', () => {
    addToCart({ id: 99, name: 'Ghost', price: 1 }, 1);
    const { isValid, errors } = validateCart(products);
    expect(isValid).toBe(false);
    expect(errors[0].type).toBe('missing');
  });
});
