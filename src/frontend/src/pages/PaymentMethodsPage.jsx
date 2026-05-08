import React, { useEffect, useMemo, useState } from 'react';
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
  Alert,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CreditCard as CreditCardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../services/paymentMethodService';

const PaymentMethodsPage = () => {
  const navigate = useNavigate();
  const { items, cartTotal, clear } = useCart();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState('by-card');
  const [selectedSavedCardId, setSelectedSavedCardId] = useState(null);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  const isEditing = useMemo(() => editingPaymentId !== null, [editingPaymentId]);

  const subtotal = cartTotal;
  const tax = parseFloat((subtotal * 0.1).toFixed(2));
  const shipping = items.length > 0 ? 9.99 : 0;
  const grandTotal = parseFloat((subtotal + tax + shipping).toFixed(2));

  const resetForm = () => {
    setCardName('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setEditingPaymentId(null);
  };

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await getPaymentMethods();
      const methods = response.payment_methods || [];
      setPaymentMethods(methods);

      if (methods.length > 0) {
        setSelectedSavedCardId((prev) =>
          prev && methods.some((method) => method.payment_id === prev)
            ? prev
            : methods[0].payment_id
        );
      } else {
        setSelectedSavedCardId(null);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load payment methods.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (paymentMethod === 'by-card') {
      loadPaymentMethods();
    } else {
      setErrorMessage('');
    }
  }, [paymentMethod]);

  const validateForm = () => {
    if (!cardName.trim() || !cardNumber.trim() || !expiryDate.trim() || !cvv.trim()) {
      return 'Please fill in all fields.';
    }

    const cleanedCardNumber = cardNumber.replace(/\D/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      return 'Card number must contain 13 to 19 digits.';
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      return 'Expiry date must be in MM/YY format.';
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      return 'CVV must be 3 or 4 digits.';
    }

    return '';
  };

  const buildPayload = () => {
    const [month, year] = expiryDate.split('/');

    return {
      card_holder_name: cardName.trim(),
      card_number: cardNumber.trim(),
      expire_month: Number(month),
      expire_year: Number(`20${year}`),
      cvv: cvv.trim(),
    };
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = buildPayload();

      if (isEditing) {
        const updated = await updatePaymentMethod(editingPaymentId, payload);
        setSelectedSavedCardId(updated.payment_id);
        setSuccessMessage('Payment method updated successfully.');
      } else {
        const created = await createPaymentMethod(payload);
        setSelectedSavedCardId(created.payment_id);
        setSuccessMessage('Payment method added successfully.');
      }

      resetForm();
      await loadPaymentMethods();
    } catch (error) {
      setErrorMessage(error.message || 'Operation failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (method) => {
    setErrorMessage('');
    setSuccessMessage('');
    setPaymentMethod('by-card');
    setEditingPaymentId(method.payment_id);
    setSelectedSavedCardId(method.payment_id);
    setCardName(method.card_holder_name);
    setCardNumber('');
    setExpiryDate(
      `${String(method.expire_month).padStart(2, '0')}/${String(method.expire_year).slice(-2)}`
    );
    setCvv('');
  };

  const openDeleteDialog = (method) => {
    setSelectedPayment(method);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;

    try {
      setDeleteLoadingId(selectedPayment.payment_id);
      setErrorMessage('');
      setSuccessMessage('');

      await deletePaymentMethod(selectedPayment.payment_id);

      if (editingPaymentId === selectedPayment.payment_id) {
        resetForm();
      }

      setDeleteDialogOpen(false);
      setSelectedPayment(null);
      setSuccessMessage('Payment method deleted successfully.');
      await loadPaymentMethods();
    } catch (error) {
      setErrorMessage(error.message || 'Delete failed.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleConfirmOrder = async () => {
    if (paymentMethod === 'by-card' && !selectedSavedCardId) {
      setErrorMessage('Please add or select a saved card before confirming.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setErrorMessage('Please enter a delivery address.');
      return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
      setErrorMessage('You must be logged in to place an order.');
      return;
    }
    try {
      setConfirmLoading(true);
      setErrorMessage('');
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ delivery_address: deliveryAddress.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to place order.');
      }
      const orderData = await res.json();
      await clear();
      setEmailSent(false);
      setCompletedOrder({ ...orderData, paymentLabel: getPaymentMethodLabel(), deliveryAddress: deliveryAddress.trim() });
      setInvoiceOpen(true);
      // Fire mock email (non-blocking)
      fetch(`/api/orders/${orderData.order_id}/send-invoice-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      }).then(() => setEmailSent(true)).catch(() => {});
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const getPaymentMethodLabel = () => {
    switch (paymentMethod) {
      case 'by-card': {
        if (selectedSavedCardId) {
          const selectedCard = paymentMethods.find(
            (method) => method.payment_id === selectedSavedCardId
          );
          return selectedCard
            ? `By Card (${selectedCard.masked_card_number})`
            : 'By Card';
        }
        return 'By Card';
      }
      case 'cash-on-delivery':
        return 'Cash on Delivery';
      case 'card-on-delivery':
        return 'Card on Delivery';
      default:
        return 'Unknown';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          Payment
        </Typography>
        <Typography variant="body1" sx={{ color: '#7f8c8d' }}>
          Choose your payment method and proceed to checkout.
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                Select Payment Method
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentMethod}
                    label="Payment Method"
                    onChange={(e) => {
                      setPaymentMethod(e.target.value);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                  >
                    <MenuItem value="by-card">By Card</MenuItem>
                    <MenuItem value="cash-on-delivery">Cash on Delivery</MenuItem>
                    <MenuItem value="card-on-delivery">Card on Delivery</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {paymentMethod === 'by-card' && (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#2c3e50' }}>
                    Card Information
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Cardholder Name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Card Number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={submitLoading}
                      sx={{
                        bgcolor: '#27ae60',
                        '&:hover': { bgcolor: '#229954' },
                        fontWeight: 'bold',
                        minWidth: 180,
                      }}
                    >
                      {submitLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={20} sx={{ color: 'white' }} />
                          Saving...
                        </Box>
                      ) : isEditing ? (
                        'Update Card'
                      ) : (
                        'Add Card'
                      )}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={resetForm}
                      disabled={submitLoading}
                      sx={{
                        borderColor: '#3498db',
                        color: '#3498db',
                        '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.05)' },
                      }}
                    >
                      Clear
                    </Button>
                  </Box>
                </>
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
            </CardContent>
          </Card>

          {paymentMethod === 'by-card' && (
            <Card sx={{ mt: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                  Saved Cards
                </Typography>

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : paymentMethods.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <CreditCardIcon sx={{ fontSize: 48, color: '#bdc3c7', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#2c3e50', mb: 1 }}>
                      No saved cards
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                      Add your first payment method using the form.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {paymentMethods.map((method) => {
                      const isSelected = selectedSavedCardId === method.payment_id;

                      return (
                        <Grid item xs={12} sm={6} md={4} key={method.payment_id}>
                          <Card
                            onClick={() => setSelectedSavedCardId(method.payment_id)}
                            sx={{
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #3498db' : '1px solid #e0e0e0',
                              boxShadow: isSelected
                                ? '0 0 0 3px rgba(52, 152, 219, 0.12)'
                                : '0 2px 8px rgba(0,0,0,0.06)',
                              borderRadius: 2,
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <CardContent>
                              <Typography
                                sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 0.5 }}
                              >
                                {method.card_holder_name}
                              </Typography>

                              <Typography sx={{ color: '#7f8c8d', mb: 0.5 }}>
                                {method.masked_card_number}
                              </Typography>

                              <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 1.5 }}>
                                Exp: {String(method.expire_month).padStart(2, '0')}/
                                {method.expire_year}
                              </Typography>

                              {isSelected && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                  Selected card
                                </Alert>
                              )}

                              {method.expired && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                  This card is expired
                                </Alert>
                              )}

                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<EditIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(method);
                                  }}
                                  sx={{
                                    borderColor: '#3498db',
                                    color: '#3498db',
                                    '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.05)' },
                                  }}
                                >
                                  Edit
                                </Button>

                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<DeleteIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(method);
                                  }}
                                  disabled={deleteLoadingId === method.payment_id}
                                >
                                  Delete
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              position: 'sticky',
              top: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Payment Method:</Typography>
                  <Typography sx={{ fontWeight: 'bold', textAlign: 'right', maxWidth: 180 }}>
                    {getPaymentMethodLabel()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  Total:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#e74c3c' }}>
                  ${grandTotal.toFixed(2)}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Delivery Address"
                placeholder="Enter your full delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleConfirmOrder}
                disabled={confirmLoading || items.length === 0}
                sx={{
                  bgcolor: '#27ae60',
                  '&:hover': { bgcolor: '#229954' },
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                }}
              >
                {confirmLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Confirm Order'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          Delete Payment Method
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this card
            {selectedPayment ? ` (${selectedPayment.masked_card_number})` : ''}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: '#7f8c8d' }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Invoice Dialog ───────────────────────────────────── */}
      <Dialog
        open={invoiceOpen}
        onClose={() => { setInvoiceOpen(false); navigate('/order-tracking'); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#27ae60', color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon />
          Order Confirmed — Invoice
        </DialogTitle>

        {completedOrder && (() => {
          const orderSubtotal = parseFloat(completedOrder.total_amount ?? 0);
          const orderTax = parseFloat((orderSubtotal * 0.1).toFixed(2));
          const orderShipping = 9.99;
          const orderGrand = parseFloat((orderSubtotal + orderTax + orderShipping).toFixed(2));
          const placedAt = completedOrder.created_at
            ? new Date(completedOrder.created_at).toLocaleString()
            : new Date().toLocaleString();

          return (
            <DialogContent sx={{ pt: 3 }}>
              {/* Meta */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Order ID</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#2c3e50' }}>#{completedOrder.order_id}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#2c3e50' }}>{placedAt}</Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Items */}
              {completedOrder.items && completedOrder.items.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#2c3e50' }}>Items</Typography>
                  <Table size="small" sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f4f6f8' }}>
                        <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Unit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {completedOrder.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="right">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                          <TableCell align="right">${parseFloat(item.subtotal).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}

              {/* Totals */}
              <Box sx={{ bgcolor: '#f8f9fa', borderRadius: 1, p: 2, mb: 2 }}>
                {[
                  { label: 'Subtotal', value: `$${orderSubtotal.toFixed(2)}` },
                  { label: 'Tax (10%)', value: `$${orderTax.toFixed(2)}` },
                  { label: 'Shipping', value: `$${orderShipping.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#7f8c8d' }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 700 }}>Grand Total</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#27ae60', fontSize: '1.1rem' }}>${orderGrand.toFixed(2)}</Typography>
                </Box>
              </Box>

              {/* Delivery & Payment */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Address</Typography>
                  <Typography variant="body2" sx={{ color: '#2c3e50', mt: 0.3 }}>{completedOrder.deliveryAddress}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  <Typography variant="caption" sx={{ color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment</Typography>
                  <Typography variant="body2" sx={{ color: '#2c3e50', mt: 0.3 }}>{completedOrder.paymentLabel}</Typography>
                </Box>
              </Box>
            </DialogContent>
          );
        })()}

        {emailSent && (
          <Alert severity="success" sx={{ mx: 3, mb: 1 }} icon={false}>
            📧 Invoice emailed to <strong>{localStorage.getItem('userEmail') || 'your account'}</strong>
          </Alert>
        )}
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => window.print()}
            sx={{ borderColor: '#7f8c8d', color: '#7f8c8d' }}
          >
            Download PDF
          </Button>
          <Button
            variant="contained"
            onClick={() => { setInvoiceOpen(false); navigate('/order-tracking'); }}
            sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' }, fontWeight: 'bold' }}
          >
            View My Orders
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentMethodsPage;