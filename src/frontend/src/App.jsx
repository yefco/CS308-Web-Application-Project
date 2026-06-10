import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CartPage from './pages/CartPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import ProductManagerPage from './pages/ProductManagerPage';
import CommentApprovalPage from './pages/CommentApprovalPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import DeliveryPage from './pages/DeliveryPage';
import SalesManagerPage from './pages/SalesManagerPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import { CartProvider, useCart } from './context/CartContext';
import './App.css';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { mergeWithUserCart } = useCart();
  const location = useLocation();

  // Check auth state on mount and whenever location changes
  useEffect(() => {
    const savedLoginState = localStorage.getItem('isLoggedIn');
    const token = localStorage.getItem('authToken');

    if (savedLoginState === 'true' && isTokenValid(token)) {
      setIsLoggedIn(true);
      mergeWithUserCart();
    } else {
      // Token missing, expired, or invalid — clear stale auth state
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('userEmail');
      setIsLoggedIn(false);
    }
  }, [location, mergeWithUserCart]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    // Merge guest cart with user cart when login succeeds
    mergeWithUserCart();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout}
      />
      
      <Box sx={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage isLoggedIn={isLoggedIn} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/signup" element={<SignUpPage onSignUpSuccess={handleLoginSuccess} />} />
          <Route path="/cart" element={<CartPage isLoggedIn={isLoggedIn} />} />
          <Route path="/payment-methods" element={<PaymentMethodsPage isLoggedIn={isLoggedIn} />} />
          <Route path="/product-manager" element={<ProductManagerPage />} />
          <Route path="/profile" element={<ProfilePage isLoggedIn={isLoggedIn} />} />
          <Route path="/order-tracking" element={<OrderTrackingPage isLoggedIn={isLoggedIn} />} />
          <Route path="/wishlist" element={<WishlistPage isLoggedIn={isLoggedIn} />} />
          <Route path="/sales-manager" element={<SalesManagerPage isLoggedIn={isLoggedIn} />} />
          <Route path="/product-manager/comment-approval" element={<CommentApprovalPage />} />
          <Route path="/delivery" element={<DeliveryPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </Router>
  );
}

export default App;
