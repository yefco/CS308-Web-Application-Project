import React, { useState } from 'react';
import {
  Popover,
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useCart } from '../context/CartContext';

const CartPreview = ({ anchorEl, onClose, onViewCart }) => {
  const { items, cartTotal, cartCount, removeItem } = useCart();
  const open = Boolean(anchorEl);

  const handleRemoveItem = (productId) => {
    removeItem(productId);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box sx={{ p: 2, minWidth: 350, maxWidth: 400 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Shopping Cart
          </Typography>
          <Typography variant="body2" sx={{ bgcolor: '#3498db', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cartCount}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Items List */}
        {items.length > 0 ? (
          <Box>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {items.map((item) => (
                <ListItem key={item.id} disableGutters>
                  <ListItemText
                    primary={item.name}
                    secondary={`${item.quantity}x $${item.price.toFixed(2)}`}
                    primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 'bold' } }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleRemoveItem(item.id)}
                      sx={{ color: '#e74c3c' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Total */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontWeight: 'bold' }}>Subtotal:</Typography>
              <Typography sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                ${cartTotal.toFixed(2)}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Button
              fullWidth
              variant="contained"
              onClick={onViewCart}
              sx={{ bgcolor: '#3498db', mb: 1 }}
            >
              View Cart
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
            >
              Continue Shopping
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Your cart is empty
            </Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default CartPreview;
