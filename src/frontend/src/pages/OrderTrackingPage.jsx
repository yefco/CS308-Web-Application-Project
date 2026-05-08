import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';
import { getUserOrders } from '../services/orderTrackingService';

const STATUS_STEPS = ['Order Placed', 'Processing', 'In Transit', 'Delivered'];

const getActiveStep = (status) => {
  switch (status?.toLowerCase().replace('-', '_')) {
    case 'processing':   return 1;
    case 'in_transit':   return 2;
    case 'delivered':    return 3;
    default:             return 0;
  }
};

const STATUS_CHIP = {
  processing:  { label: 'Processing',  color: 'warning' },
  in_transit:  { label: 'In Transit',  color: 'info'    },
  delivered:   { label: 'Delivered',   color: 'success' },
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

const OrderTrackingPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (orders.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <OrderIcon sx={{ fontSize: 80, color: '#bdc3c7', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          No Orders Yet
        </Typography>
        <Typography sx={{ color: '#7f8c8d', mb: 4 }}>
          You haven't placed any orders yet. Start shopping!
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
        {/* Page title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            My Orders
          </Typography>
          <Typography sx={{ color: '#7f8c8d', mt: 0.5 }}>
            {orders.length} order{orders.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {orders.map((order) => {
          const orderId = order.order_id ?? order.id;
          const status = order.status ?? 'processing';
          const chip = getChip(status);
          const activeStep = getActiveStep(status);
          const total = parseFloat(order.total_amount ?? order.total ?? 0);

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
              {/* Card header */}
              <Box
                sx={{
                  px: 3, py: 2,
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
                  <Chip
                    label={chip.label}
                    color={chip.color}
                    size="small"
                    sx={{ fontWeight: 600, fontSize: 11 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#95a5a6' }}>
                  <DateIcon sx={{ fontSize: 15 }} />
                  <Typography variant="body2">{fmt(order.created_at)}</Typography>
                </Box>
              </Box>

              <CardContent sx={{ px: 3, py: 3 }}>
                {/* Progress stepper */}
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
                  {STATUS_STEPS.map((label) => (
                    <Step key={label}>
                      <StepLabel
                        sx={{
                          '& .MuiStepLabel-label': { fontSize: 12, fontWeight: 500 },
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Delivery address */}
                {order.delivery_address && (
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'flex-start', gap: 1,
                      bgcolor: '#f8f9fa', borderRadius: 2, px: 2, py: 1.5, mb: 2,
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

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                      Items
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                      {order.items.map((item, i) => (
                        <Box
                          key={i}
                          sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            py: 1, px: 1.5, borderRadius: 1.5, bgcolor: '#fafafa',
                            border: '1px solid #f0f0f0',
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
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#3498db' }}>
                            ${parseFloat(item.subtotal ?? (item.unit_price * item.quantity) ?? 0).toFixed(2)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* Total */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, pt: 0.5 }}>
                  <Typography sx={{ color: '#7f8c8d', fontWeight: 600 }}>Order Total</Typography>
                  <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#2c3e50' }}>
                    ${total.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Container>
    </Box>
  );
};

export default OrderTrackingPage;
