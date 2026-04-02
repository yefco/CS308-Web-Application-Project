import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingBag as EmptyCartIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import '../styles/CartPage.css';

const CartPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const { items, cartTotal, removeItem, updateQuantity } = useCart();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Calculate totals
  const subtotal = cartTotal;
  const tax = parseFloat((subtotal * 0.1).toFixed(2)); // 10% tax
  const shipping = items.length > 0 ? 9.99 : 0;
  const grandTotal = parseFloat((subtotal + tax + shipping).toFixed(2));

  const handleRemoveClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      removeItem(itemToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleQuantityChange = (productId, currentQuantity, newValue) => {
    const quantity = parseInt(newValue);
    if (quantity > 0 && quantity <= 999) {
      updateQuantity(productId, quantity);
    }
  };

  const handleIncreaseQuantity = (productId, currentQuantity, stock) => {
    if (currentQuantity < stock) {
      updateQuantity(productId, currentQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: '/cart' } });
      return;
    }
    // Checkout feature coming soon
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: '#f8f9fa' }}>
          <EmptyCartIcon sx={{ fontSize: 80, color: '#bdc3c7', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2, color: '#2c3e50' }}>
            Your Shopping Cart is Empty
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, color: '#7f8c8d' }}>
            Browse our products and add items to your cart to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#3498db',
              '&:hover': { bgcolor: '#2980b9' },
            }}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          Shopping Cart
        </Typography>
        <Typography variant="body1" sx={{ color: '#7f8c8d' }}>
          You have <strong>{items.length}</strong> item(s) in your cart
        </Typography>
      </Box>

      {!isLoggedIn && (
        <Alert severity="info" sx={{ mb: 4 }} onClose={() => {}}>
          <Typography variant="body2">
            You can browse and add items to your cart without logging in, but you'll need to{' '}
            <strong>sign in or create an account</strong> before you can complete your purchase.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#ecf0f1' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#2c3e50' }}>Product</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Price
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Quantity
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Subtotal
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                            bgcolor: '#ecf0f1',
                          }}
                        />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#95a5a6' }}>
                            Stock Available: {item.stock}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                        ${item.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDecreaseQuantity(item.id, item.quantity)}
                          disabled={item.quantity <= 1}
                          sx={{ color: '#3498db' }}
                        >
                          <RemoveIcon fontSize="small" />
                        </IconButton>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(item.id, item.quantity, e.target.value)
                          }
                          inputProps={{
                            min: 1,
                            max: item.stock,
                            style: { textAlign: 'center', width: 50 },
                          }}
                          variant="outlined"
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleIncreaseQuantity(item.id, item.quantity, item.stock)}
                          disabled={item.quantity >= item.stock}
                          sx={{ color: '#3498db' }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveClick(item)}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(231, 76, 60, 0.1)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Continue Shopping Button */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
              sx={{
                borderColor: '#3498db',
                color: '#3498db',
                '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.05)' },
              }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                Order Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Subtotal:</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    ${subtotal.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Tax (10%):</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    ${tax.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Shipping:</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {items.length > 0 ? `$${shipping.toFixed(2)}` : 'Free'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCheckout}
                sx={{
                  bgcolor: '#27ae60',
                  '&:hover': { bgcolor: '#229954' },
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  mb: 2,
                }}
              >
                {isLoggedIn ? 'Proceed to Checkout' : 'Sign In to Checkout'}
              </Button>

              {!isLoggedIn && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/signup')}
                  sx={{ py: 1.5 }}
                >
                  Create Account
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ color: '#2c3e50', fontWeight: 'bold' }}>Remove Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{itemToDelete?.name}</strong> from your cart?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#7f8c8d' }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CartPage;
