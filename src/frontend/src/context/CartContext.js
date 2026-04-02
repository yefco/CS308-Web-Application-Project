import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  saveCart,
  mergeGuestCartWithUserCart,
} from '../utils/cartUtils';

/**
 * Cart Context - Provides global cart state and operations
 */
const CartContext = createContext();

/**
 * Custom hook to use Cart Context
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

/**
 * Cart Provider Component
 */
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  // Update cart statistics
  const updateCartStats = useCallback((cartItems) => {
    const count = cartItems.reduce((total, item) => total + item.quantity, 0);
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartCount(count);
    setCartTotal(parseFloat(total.toFixed(2)));
  }, []);

  // Initialize cart from localStorage on mount
  useEffect(() => {
    const savedCart = getCart();
    setItems(savedCart);
    updateCartStats(savedCart);
  }, [updateCartStats]);

  // Add item to cart
  const addItem = useCallback((product, quantity = 1) => {
    const updatedCart = addToCart(product, quantity);
    setItems(updatedCart);
    updateCartStats(updatedCart);
  }, [updateCartStats]);

  // Remove item from cart
  const removeItem = useCallback((productId) => {
    const updatedCart = removeFromCart(productId);
    setItems(updatedCart);
    updateCartStats(updatedCart);
  }, [updateCartStats]);

  // Update item quantity
  const updateQuantity = useCallback((productId, quantity) => {
    const updatedCart = updateCartQuantity(productId, quantity);
    setItems(updatedCart);
    updateCartStats(updatedCart);
  }, [updateCartStats]);

  // Clear entire cart
  const clear = useCallback(() => {
    clearCart();
    setItems([]);
    setCartCount(0);
    setCartTotal(0);
  }, []);

  // Merge guest cart with user cart (called on login)
  const mergeWithUserCart = useCallback((userCartItems = []) => {
    const mergedCart = mergeGuestCartWithUserCart(userCartItems);
    saveCart(mergedCart);
    setItems(mergedCart);
    updateCartStats(mergedCart);
  }, [updateCartStats]);

  // Get specific item from cart
  const getItem = useCallback((productId) => {
    return items.find(item => item.id === productId);
  }, [items]);

  // Check if item is in cart
  const hasItem = useCallback((productId) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const value = {
    items,
    cartCount,
    cartTotal,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    mergeWithUserCart,
    getItem,
    hasItem,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
