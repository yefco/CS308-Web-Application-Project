import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import {
  CalendarToday as DateIcon,
  LocationOn as LocationIcon,
  ReceiptLong as ReceiptIcon,
  ShoppingBag as OrderIcon,
} from '@mui/icons-material';
import { cancelOrder, getUserOrders, returnOrder } from '../services/orderTrackingService';

const requestItemReturn = async (orderId, itemId) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`/api/orders/${orderId}/items/${itemId}/return-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || 'Return request failed.');
  return data;
};

const STATUS_STEPS = ['Order Placed', 'Processing', 'In Transit', 'Delivered'];
const RETURN_WINDOW_DAYS = 30;

const getActiveStep = (status) => {
  switch (status?.toLowerCase().replace('-', '_')) {
    case 'processing':
      return 1;
    case 'in_transit':
      return 2;
    case 'delivered':
      return 3;
    default:
      return 0;
  }
};

const STATUS_CHIP = {
  processing: { label: 'Processing', color: 'warning' },
  in_transit: { label: 'In Transit', color: 'info' },
  delivered: { label: 'Delivered', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
  returned: { label: 'Returned', color: 'secondary' },
};

const getChip = (status) => {
  const key = status?.toLowerCase().replace('-', '_');
  return STATUS_CHIP[key] || { label: status || 'Processing', color: 'default' };
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const isWithinReturnWindow = (createdAt) => {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= RETURN_WINDOW_DAYS;
};

const OrderTrackingPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, order: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [itemReturnLoading, setItemReturnLoading] = useState({});

  useEffect(() => {
    if (!isLoggedIn) navigate('/login', { state: { returnTo: '/order-tracking' } });
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserOrders();
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data?.orders ?? []);
          setOrders(list);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load orders.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [orders]
  );

  const openActionDialog = (type, order) => {
    setActionDialog({ open: true, type, order });
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null, order: null });
  };

  const handleOrderAction = async () => {
    if (!actionDialog.order || !actionDialog.type) return;

    const orderId = actionDialog.order.order_id ?? actionDialog.order.id;
    setActionLoading(true);

    try {
      const updatedOrder = actionDialog.type === 'cancel'
        ? await cancelOrder(orderId)
        : await returnOrder(orderId);

      setOrders((prev) => prev.map((order) => {
        const currentId = order.order_id ?? order.id;
        return currentId === orderId ? updatedOrder : order;
      }));

      setSnack({
        open: true,
        message: actionDialog.type === 'cancel'
          ? `Order #${orderId} was cancelled and stock was restored.`
          : `Order #${orderId} was returned successfully.`,
        severity: 'success',
      });
      closeActionDialog();
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Action failed.', severity: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (sortedOrders.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <OrderIcon sx={{ fontSize: 80, color: '#bdc3c7', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          No Orders Yet
        </Typography>
        <Typography sx={{ color: '#7f8c8d', mb: 4 }}>
          You haven't placed any orders yet. Start shopping.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/')}
          sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' }, borderRadius: 2, px: 4 }}
        >
          Browse Products
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            My Orders
          </Typography>
          <Typography sx={{ color: '#7f8c8d', mt: 0.5 }}>
            {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {sortedOrders.map((order) => {
          const orderId = order.order_id ?? order.id;
          const status = order.status ?? 'processing';
          const normalizedStatus = status.toLowerCase().replace('-', '_');
          const chip = getChip(status);
          const activeStep = getActiveStep(status);
          const total = parseFloat(order.total_amount ?? order.total ?? 0);
          const canCancel = normalizedStatus === 'processing';
          const canReturn =
            normalizedStatus === 'delivered' && isWithinReturnWindow(order.created_at);
          const terminalMessage = normalizedStatus === 'cancelled'
            ? 'This order was cancelled. Stock was returned to inventory.'
            : normalizedStatus === 'returned'
              ? 'This order was returned and marked as closed.'
              : null;

          return (
            <Card
              key={orderId}
              elevation={0}
              sx={{
                mb: 3,
                border: '1px solid #e0e0e0',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.10)' },
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: '#fff',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <ReceiptIcon sx={{ color: '#3498db', fontSize: 20 }} />
                  <Typography sx={{ fontWeight: 700, color: '#2c3e50', fontSize: 15 }}>
                    Order #{orderId}
                  </Typography>
                  <Chip label={chip.label} color={chip.color} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#95a5a6' }}>
                  <DateIcon sx={{ fontSize: 15 }} />
                  <Typography variant="body2">{fmt(order.created_at)}</Typography>
                </Box>
              </Box>

              <CardContent sx={{ px: 3, py: 3 }}>
                {terminalMessage ? (
                  <Alert severity={normalizedStatus === 'cancelled' ? 'warning' : 'info'} sx={{ mb: 3 }}>
                    {terminalMessage}
                  </Alert>
                ) : (
                  <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                    {STATUS_STEPS.map((label) => (
                      <Step key={label}>
                        <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 12, fontWeight: 500 } }}>
                          {label}
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                )}

                {order.delivery_address && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      bgcolor: '#f8f9fa',
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      mb: 2,
                    }}
                  >
                    <LocationIcon sx={{ color: '#3498db', fontSize: 18, mt: 0.2 }} />
                    <Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Delivery Address
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#2c3e50', mt: 0.3 }}>
                        {order.delivery_address}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {order.items && order.items.length > 0 && (
                  <>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                      Items
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      {order.items.map((item, index) => {
                        const itemKey = `${orderId}-${item.order_item_id ?? index}`;
                        const canReturnItem = canReturn && item.order_item_id;
                        return (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 1,
                              px: 1.5,
                              borderRadius: 1.5,
                              bgcolor: '#fafafa',
                              border: '1px solid #f0f0f0',
                              flexWrap: 'wrap',
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                {item.product_name ?? item.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#95a5a6' }}>
                                Qty: {item.quantity} × ${parseFloat(item.unit_price ?? item.price ?? 0).toFixed(2)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#3498db' }}>
                                ${parseFloat(item.subtotal ?? (item.unit_price * item.quantity) ?? 0).toFixed(2)}
                              </Typography>
                              {canReturnItem && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="secondary"
                                  disabled={!!itemReturnLoading[itemKey]}
                                  onClick={async () => {
                                    setItemReturnLoading(prev => ({ ...prev, [itemKey]: true }));
                                    try {
                                      await requestItemReturn(orderId, item.order_item_id);
                                      setSnack({ open: true, message: `Return request submitted for ${item.product_name ?? 'item'}.`, severity: 'success' });
                                    } catch (err) {
                                      setSnack({ open: true, message: err.message || 'Return request failed.', severity: 'error' });
                                    } finally {
                                      setItemReturnLoading(prev => ({ ...prev, [itemKey]: false }));
                                    }
                                  }}
                                >
                                  {itemReturnLoading[itemKey] ? 'Requesting…' : 'Return Item'}
                                </Button>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', pt: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {canCancel && (
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => openActionDialog('cancel', order)}
                      >
                        Cancel Order
                      </Button>
                    )}
                    {canReturn && (
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => openActionDialog('return', order)}
                      >
                        Return Order
                      </Button>
                    )}
                    {normalizedStatus === 'delivered' && !canReturn && (
                      <Typography variant="caption" sx={{ color: '#7f8c8d', alignSelf: 'center' }}>
                        Return window closed after {RETURN_WINDOW_DAYS} days.
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography sx={{ color: '#7f8c8d', fontWeight: 600 }}>Order Total</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#2c3e50' }}>
                      ${total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Container>

      <Dialog open={actionDialog.open} onClose={actionLoading ? undefined : closeActionDialog}>
        <DialogTitle>
          {actionDialog.type === 'cancel' ? 'Cancel Order' : 'Return Order'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#4a5568' }}>
            {actionDialog.type === 'cancel'
              ? 'This will cancel the order and restore its items to stock.'
              : `This will mark the order as returned. Returns are limited to ${RETURN_WINDOW_DAYS} days after purchase.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog} disabled={actionLoading}>Close</Button>
          <Button
            onClick={handleOrderAction}
            color={actionDialog.type === 'cancel' ? 'warning' : 'secondary'}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Working...' : actionDialog.type === 'cancel' ? 'Confirm Cancel' : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderTrackingPage;
