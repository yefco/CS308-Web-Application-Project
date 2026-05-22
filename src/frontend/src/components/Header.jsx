import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Popover,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Dashboard,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { getNotifications, markAllRead } from '../services/notificationService';
import '../styles/Header.css';

const Header = ({ isLoggedIn, onLogout }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = (() => {
    try {
      const raw = localStorage.getItem('userData');
      return raw ? JSON.parse(raw).role : null;
    } catch {
      return null;
    }
  })();
  const isCustomer = userRole === 'customer' || userRole === 'Customer';
  const isProductManager = userRole === 'product_manager' || userRole === 'ProductManager';
  const isSalesManager = userRole === 'sales_manager' || userRole === 'SalesManager';

  useEffect(() => {
    if (!isLoggedIn || !isCustomer) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await getNotifications();
        if (!cancelled) {
          setNotifications(data?.notifications ?? []);
          setUnreadCount(data?.unread_count ?? 0);
        }
      } catch {
        // silently ignore
      }
    };
    poll();
    const interval = setInterval(poll, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isLoggedIn, isCustomer]);

  const handleNotifOpen = async (e) => {
    setNotifAnchor(e.currentTarget);
    if (unreadCount > 0) {
      try {
        await markAllRead();
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch {
        // ignore
      }
    }
  };
  const handleNotifClose = () => setNotifAnchor(null);

  const handleMobileMenuOpen = (e) => setMobileMenuAnchor(e.currentTarget);
  const handleMobileMenuClose = () => setMobileMenuAnchor(null);
  const handleUserMenuOpen = (e) => setUserMenuAnchor(e.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    handleUserMenuClose();
    onLogout();
    navigate('/');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#2c3e50', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#3498db',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.2rem',
                }}
              >
                TS
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: '#fff',
                  fontSize: '1.3rem',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                TechStore
              </Typography>
            </Box>
          </RouterLink>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Cart Button */}
            <IconButton
              color="inherit"
              onClick={() => navigate('/cart')}
              sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
            >
              <Badge badgeContent={cartCount} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {/* Notification Bell (customers only) */}
            {isLoggedIn && isCustomer && (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleNotifOpen}
                  sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
                <Popover
                  open={!!notifAnchor}
                  anchorEl={notifAnchor}
                  onClose={handleNotifClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{ sx: { width: 340, maxHeight: 400, overflow: 'auto' } }}
                >
                  <Box sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
                    Notifications
                  </Box>
                  {notifications.length === 0 ? (
                    <Box sx={{ p: 2, color: '#7f8c8d' }}>No notifications yet.</Box>
                  ) : (
                    <List dense disablePadding>
                      {notifications.map((n, i) => (
                        <React.Fragment key={n.notification_id}>
                          <ListItem
                            sx={{ bgcolor: n.is_read ? 'transparent' : '#ebf5fb', alignItems: 'flex-start' }}
                          >
                            <ListItemText
                              primary={n.message}
                              secondary={new Date(n.created_at).toLocaleString()}
                              primaryTypographyProps={{ fontSize: 13 }}
                              secondaryTypographyProps={{ fontSize: 11 }}
                            />
                          </ListItem>
                          {i < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Popover>
              </>
            )}

            {/* Auth Buttons / User Menu */}
            {!isLoggedIn ? (
              <>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/signup')}
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    bgcolor: '#3498db',
                    '&:hover': { bgcolor: '#2980b9' },
                    fontWeight: 'bold',
                  }}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <Box>
                <IconButton
                  onClick={handleUserMenuOpen}
                  sx={{ color: 'inherit' }}
                >
                  <AccountCircle sx={{ fontSize: '1.8rem' }} />
                </IconButton>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={!!userMenuAnchor}
                  onClose={handleUserMenuClose}
                  PaperProps={{
                    sx: { mt: 1, minWidth: '200px' },
                  }}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="textSecondary">
                      {localStorage.getItem('userEmail')}
                    </Typography>
                  </MenuItem>
                  <MenuItem divider />
                  {isProductManager && (
                    <MenuItem
                      onClick={() => { navigate('/product-manager'); handleUserMenuClose(); }}
                      sx={{ color: '#3498db', fontWeight: 'bold' }}
                    >
                      <Dashboard sx={{ mr: 1, fontSize: '1.2rem' }} />
                      Product Manager
                    </MenuItem>
                  )}
                  {isSalesManager && (
                    <MenuItem
                      onClick={() => { navigate('/sales-manager'); handleUserMenuClose(); }}
                      sx={{ color: '#27ae60', fontWeight: 'bold' }}
                    >
                      <Dashboard sx={{ mr: 1, fontSize: '1.2rem' }} />
                      Sales Manager
                    </MenuItem>
                  )}
                  {isSalesManager && (
                    <MenuItem
                      onClick={() => { navigate('/delivery'); handleUserMenuClose(); }}
                      sx={{ color: '#16a085', fontWeight: 'bold' }}
                    >
                      <Dashboard sx={{ mr: 1, fontSize: '1.2rem' }} />
                      Delivery Dashboard
                    </MenuItem>
                  )}
                  {isCustomer && (
                    <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
                      My Profile
                    </MenuItem>
                  )}
                  {isCustomer && (
                    <MenuItem onClick={() => { navigate('/order-tracking'); handleUserMenuClose(); }}>
                      Track Orders
                    </MenuItem>
                  )}
                  {isCustomer && (
                    <MenuItem onClick={() => { navigate('/wishlist'); handleUserMenuClose(); }}>
                      Wishlist
                    </MenuItem>
                  )}
                  <MenuItem divider />
                  <MenuItem onClick={handleLogout} sx={{ color: '#e74c3c' }}>
                    <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                    Sign Out
                  </MenuItem>
                </Menu>
              </Box>
            )}

            {/* Mobile Menu */}
            <IconButton
              onClick={handleMobileMenuOpen}
              sx={{ display: { xs: 'block', sm: 'none' }, color: 'inherit' }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={!!mobileMenuAnchor}
              onClose={handleMobileMenuClose}
            >
              {!isLoggedIn && (
                <>
                  <MenuItem onClick={() => { navigate('/login'); handleMobileMenuClose(); }}>
                    Sign In
                  </MenuItem>
                  <MenuItem onClick={() => { navigate('/signup'); handleMobileMenuClose(); }}>
                    Sign Up
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
