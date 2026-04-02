import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import CartPage from './pages/CartPage';
import PaymentPage from './pages/PaymentPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import { CartProvider, useCart } from './context/CartContext';
import './App.css';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { mergeWithUserCart } = useCart();
  const location = useLocation();

  // Check auth state on mount and whenever location changes
  useEffect(() => {
    const savedLoginState = localStorage.getItem('isLoggedIn');
    if (savedLoginState === 'true') {
      setIsLoggedIn(true);
      // Merge guest cart with user cart on login
      mergeWithUserCart();
    } else {
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
          <Route path="/payment" element={<PaymentPage isLoggedIn={isLoggedIn} />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<div>Orders Page</div>} />
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
