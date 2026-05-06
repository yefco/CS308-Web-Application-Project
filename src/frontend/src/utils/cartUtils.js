/**
 * Cart utilities for managing shopping cart functionality
 * Handles localStorage persistence and cart operations
 */

const CART_STORAGE_KEY = 'shopping_cart';
const USER_CART_STORAGE_KEY = 'user_shopping_cart';

/**
 * Get the current shopping cart from localStorage
 * @returns {Array} Array of cart items
 */
export const getCart = () => {
  const cart = localStorage.getItem(CART_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
};

/**
 * Get the user's shopping cart (for authenticated users)
 * @returns {Array} Array of cart items
 */
export const getUserCart = () => {
  const cart = localStorage.getItem(USER_CART_STORAGE_KEY);
  return cart ? JSON.parse(cart) : [];
};

/**
 * Save cart to localStorage
 * @param {Array} items - Cart items to save
 */
export const saveCart = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

/**
 * Save user cart to localStorage
 * @param {Array} items - Cart items to save
 */
export const saveUserCart = (items) => {
  localStorage.setItem(USER_CART_STORAGE_KEY, JSON.stringify(items));
};

/**
 * Add item to cart
 * @param {Object} product - Product to add
 * @param {number} quantity - Quantity to add (default: 1)
 */
export const addToCart = (product, quantity = 1) => {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      ...product,
      quantity,
      addedAt: new Date().toISOString(),
    });
  }

  saveCart(cart);
  return cart;
};

/**
 * Remove item from cart
 * @param {number} productId - ID of product to remove
 */
export const removeFromCart = (productId) => {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  return cart;
};

/**
 * Update item quantity in cart
 * @param {number} productId - ID of product
 * @param {number} quantity - New quantity
 */
export const updateCartQuantity = (productId, quantity) => {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
  }

  saveCart(cart);
  return cart;
};

/**
 * Clear the cart
 */
export const clearCart = () => {
  localStorage.removeItem(CART_STORAGE_KEY);
};

/**
 * Clear user cart
 */
export const clearUserCart = () => {
  localStorage.removeItem(USER_CART_STORAGE_KEY);
};

/**
 * Get cart count (total number of items)
 */
export const getCartCount = () => {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Get cart total price
 */
export const getCartTotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

/**
 * Merge guest cart with user cart when user logs in
 * Guest items take priority if same product exists in both carts
 * @param {Array} userCart - User's existing cart items
 * @returns {Array} Merged cart
 */
export const mergeGuestCartWithUserCart = (userCart = []) => {
  const guestCart = getCart();
  const merged = [...userCart];

  guestCart.forEach(guestItem => {
    const existingIndex = merged.findIndex(item => item.id === guestItem.id);
    if (existingIndex >= 0) {
      // Add guest cart quantity to existing item
      merged[existingIndex].quantity += guestItem.quantity;
    } else {
      // Add new item from guest cart
      merged.push(guestItem);
    }
  });

  return merged;
};

/**
 * Validate cart items (e.g., check stock availability)
 * @param {Array} products - Original product list with stock info
 * @returns {Object} Validation result with any errors
 */
export const validateCart = (products) => {
  const cart = getCart();
  const errors = [];

  cart.forEach(cartItem => {
    const product = products.find(p => p.id === cartItem.id);
    if (!product) {
      errors.push({
        productId: cartItem.id,
        message: 'Product no longer available',
        type: 'missing',
      });
    } else if (cartItem.quantity > product.stock) {
      errors.push({
        productId: cartItem.id,
        message: `Only ${product.stock} items in stock`,
        type: 'stock',
        availableStock: product.stock,
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get cart items with current product details
 * Useful for updates to price, stock, etc.
 * @param {Array} products - Current product list
 * @returns {Array} Cart items with updated product information
 */
export const getCartWithUpdatedProducts = (products) => {
  const cart = getCart();
  return cart.map(cartItem => {
    const currentProduct = products.find(p => p.id === cartItem.id);
    if (currentProduct) {
      return {
        ...cartItem,
        ...currentProduct,
        _cartQuantity: cartItem.quantity,
      };
    }
    return cartItem;
  });
};

/**
 * Export cart data for order processing
 * @returns {Object} Cart data ready for API submission
 */
export const exportCartForOrder = () => {
  const cart = getCart();
  const total = getCartTotal();
  const subtotal = total;
  const tax = parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax example
  const shipping = cart.length > 0 ? 9.99 : 0;
  const grandTotal = parseFloat((subtotal + tax + shipping).toFixed(2));

  return {
    items: cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
      subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
    })),
    summary: {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      shipping,
      total: grandTotal,
      itemCount: cart.length,
      itemQuantity: getCartCount(),
    },
    timestamp: new Date().toISOString(),
  };
};
