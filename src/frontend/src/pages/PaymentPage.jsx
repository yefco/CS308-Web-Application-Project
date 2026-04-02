import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';

import { useCart } from '../context/CartContext';
import { submitPayment } from '../services/paymentService';

const PaymentPage = () => {
  const navigate = useNavigate();
  const { items, cartTotal } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = cartTotal;
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const shipping = items.length > 0 ? 9.99 : 0;
  const grandTotal = parseFloat((subtotal + tax + shipping).toFixed(2));

  const validateCreditCardFields = () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');

    if (!cardName || !cardNumber || !expiryDate || !cvv) {
      return 'Please fill in all card details.';
    }

    if (!/^\d{16}$/.test(cleanedCardNumber)) {
      return 'Card number must be 16 digits.';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      return 'Expiry date must be in MM/YY format.';
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return 'CVV must be 3 or 4 digits.';
    }

    return '';
  };

  const handleConfirmPayment = async () => {
    setErrorMessage('');

    if (items.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    if (paymentMethod === 'credit-card') {
      const validationError = validateCreditCardFields();
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    const payload = {
      paymentMethod,
      billingDetails:
        paymentMethod === 'credit-card'
          ? {
              cardName,
              cardNumber,
              expiryDate,
              cvv,
            }
          : null,
      orderSummary: {
        subtotal,
        tax,
        shipping,
        total: grandTotal,
      },
      items,
    };

    try {
      setIsSubmitting(true);

      const response = await submitPayment(payload);

      navigate('/order-success', {
        state: {
          orderId: response.orderId,
          paymentMethod,
          total: grandTotal,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || 'Payment could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          Payment Method
        </Typography>
        <Typography variant="body1" sx={{ color: '#7f8c8d' }}>
          Complete your payment details to finish your order
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                Select Payment Method
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <MenuItem value="credit-card">Credit Card</MenuItem>
                    <MenuItem value="paypal">PayPal</MenuItem>
                    <MenuItem value="cash-on-delivery">Cash on Delivery</MenuItem>
                    <MenuItem value="card-on-delivery">Card on Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {paymentMethod === 'credit-card' && (
                <Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50' }}
                  >
                    Card Information
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        inputProps={{ maxLength: 19 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        inputProps={{ maxLength: 5 }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        inputProps={{ maxLength: 4 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {paymentMethod === 'paypal' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You will be redirected to PayPal after confirming your payment.
                </Alert>
              )}

              {paymentMethod === 'cash-on-delivery' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  You will pay in cash when your order is delivered.
                </Alert>
              )}

              {paymentMethod === 'card-on-delivery' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You can pay by card when your order is delivered.
                </Alert>
              )}

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/cart')}
                  disabled={isSubmitting}
                  sx={{
                    borderColor: '#3498db',
                    color: '#3498db',
                    '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.05)' },
                  }}
                >
                  Back to Cart
                </Button>

                <Button
                  variant="contained"
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: '#27ae60',
                    '&:hover': { bgcolor: '#229954' },
                    fontWeight: 'bold',
                    minWidth: 180,
                  }}
                >
                  {isSubmitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      Processing...
                    </Box>
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  Total:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PaymentPage;