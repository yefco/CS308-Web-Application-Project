import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const orderData = location.state || {};
  const {
    orderId = 'N/A',
    paymentMethod = 'Unknown',
    total = 0,
  } = orderData;

  const formatPaymentMethod = (method) => {
    switch (method) {
      case 'credit-card':
        return 'Credit Card';
      case 'paypal':
        return 'PayPal';
      case 'cash-on-delivery':
        return 'Cash on Delivery';
      case 'card-on-delivery':
        return 'Card on Delivery';
      default:
        return method;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={3}
        sx={{
          p: 5,
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 90, color: '#27ae60', mb: 2 }} />

        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 2 }}>
          Order Successful
        </Typography>

        <Typography variant="body1" sx={{ color: '#7f8c8d', mb: 4 }}>
          Thank you for your purchase. Your order has been placed successfully.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ textAlign: 'left', maxWidth: 420, mx: 'auto', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ color: '#7f8c8d' }}>Order ID:</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>{orderId}</Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ color: '#7f8c8d' }}>Payment Method:</Typography>
            <Typography sx={{ fontWeight: 'bold' }}>
              {formatPaymentMethod(paymentMethod)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography sx={{ color: '#7f8c8d' }}>Total Paid:</Typography>
            <Typography sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
              ${Number(total).toFixed(2)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{
              bgcolor: '#3498db',
              '&:hover': { bgcolor: '#2980b9' },
              px: 4,
            }}
          >
            Go to Home
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/orders')}
            sx={{
              borderColor: '#3498db',
              color: '#3498db',
              px: 4,
            }}
          >
            View Orders
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default OrderSuccessPage;