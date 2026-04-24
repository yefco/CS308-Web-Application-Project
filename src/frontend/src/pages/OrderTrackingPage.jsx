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
  Grid,
} from '@mui/material';
import {
  ShoppingBag as OrderIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { getUserOrders, getUserDeliveries } from '../services/orderTrackingService';
import '../styles/OrderTracking.css';

/**
 * OrderTrackingPage Component
 * Displays user's orders and their delivery status with real-time tracking
 */
const OrderTrackingPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryData, setDeliveryData] = useState({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: '/order-tracking' } });
    }
  }, [isLoggedIn, navigate]);

  // Fetch orders and delivery data on component mount
  useEffect(() => {
    const fetchOrdersData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's orders
        const ordersData = await getUserOrders();
        setOrders(Array.isArray(ordersData) ? ordersData : []);

        // Fetch delivery information for all orders
        try {
          const deliveriesData = await getUserDeliveries();
          if (deliveriesData && Array.isArray(deliveriesData)) {
            const deliveryMap = {};
            deliveriesData.forEach((delivery) => {
              deliveryMap[delivery.order_id] = delivery;
            });
            setDeliveryData(deliveryMap);
          }
        } catch (err) {
          console.log('Deliveries not yet available:', err.message);
          // Continue without delivery data - orders may not have been processed yet
        }
      } catch (err) {
        setError(err.message || 'Failed to load orders. Please try again later.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchOrdersData();
    }
  }, [isLoggedIn]);

  // Get status-specific information
  const getStatusInfo = (status) => {
    const statusMap = {
      processing: {
        label: 'Processing',
        className: 'status-processing',
        icon: OrderIcon,
        steps: [
          { title: 'Order Placed', completed: true, timestamp: new Date() },
          {
            title: 'Payment Confirmed',
            completed: true,
            timestamp: new Date(Date.now() - 3600000),
          },
          {
            title: 'Preparing for Shipment',
            completed: false,
            inProgress: true,
          },
          { title: 'In Transit', completed: false },
          { title: 'Delivered', completed: false },
        ],
      },
      'in-transit': {
        label: 'In Transit',
        className: 'status-in-transit',
        icon: ShippingIcon,
        steps: [
          { title: 'Order Placed', completed: true, timestamp: new Date() },
          {
            title: 'Payment Confirmed',
            completed: true,
            timestamp: new Date(Date.now() - 3600000),
          },
          {
            title: 'Shipped',
            completed: true,
            timestamp: new Date(Date.now() - 7200000),
          },
          {
            title: 'In Transit',
            completed: false,
            inProgress: true,
            estimatedDelivery: new Date(Date.now() + 86400000), // +1 day
          },
          { title: 'Delivered', completed: false },
        ],
      },
      delivered: {
        label: 'Delivered',
        className: 'status-delivered',
        icon: DeliveredIcon,
        steps: [
          { title: 'Order Placed', completed: true, timestamp: new Date() },
          {
            title: 'Payment Confirmed',
            completed: true,
            timestamp: new Date(Date.now() - 86400000),
          },
          {
            title: 'Shipped',
            completed: true,
            timestamp: new Date(Date.now() - 43200000),
          },
          {
            title: 'In Transit',
            completed: true,
            timestamp: new Date(Date.now() - 14400000),
          },
          {
            title: 'Delivered',
            completed: true,
            timestamp: new Date(Date.now() - 3600000),
          },
        ],
      },
    };

    return statusMap[status?.toLowerCase()] || statusMap.processing;
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Pending';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render tracking timeline
  const renderTrackingTimeline = (order) => {
    const delivery = deliveryData[order.id];
    const status = delivery?.status || order.status || 'processing';
    const statusInfo = getStatusInfo(status);

    return (
      <div className="tracking-timeline">
        {statusInfo.steps.map((step, index) => (
          <div
            key={index}
            className={`tracking-step ${
              step.completed
                ? 'completed'
                : step.inProgress
                  ? 'in-progress'
                  : 'pending'
            }`}
          >
            <p className="tracking-step-title">{step.title}</p>
            <p className="tracking-step-date">
              {step.completed && step.timestamp
                ? `${formatDate(step.timestamp)} at ${formatTime(step.timestamp)}`
                : step.inProgress
                  ? `Est. ${formatDate(step.estimatedDelivery || new Date(Date.now() + 86400000))}`
                  : 'Pending'}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Box className="loading">
        <CircularProgress size={50} />
      </Box>
    );
  }

  // No orders state
  if (orders.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box className="no-orders">
          <OrderIcon className="no-orders-icon" />
          <Typography variant="h4" component="h2" className="no-orders">
            No Orders Yet
          </Typography>
          <Typography variant="body1" sx={{ color: '#7f8c8d', mb: 3 }}>
            You haven't placed any orders yet. Start shopping to track your deliveries!
          </Typography>
          <Button
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: '25px',
              fontWeight: 600,
            }}
            onClick={() => navigate('/')}
          >
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <div className="order-tracking-container">
      <Container maxWidth="lg">
        {/* Header */}
        <Box className="tracking-header">
          <Typography variant="h4" component="h1">
            Order Tracking
          </Typography>
          <Typography variant="body2">
            Track the status and delivery of your orders in real-time
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Info Alert */}
        {orders.length > 0 && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
            Your orders are being processed and prepared for shipment. Check back regularly for
            delivery updates.
          </Alert>
        )}

        {/* Orders List */}
        <Box sx={{ pb: 4 }}>
          {orders.map((order) => {
            const delivery = deliveryData[order.id];
            const status = delivery?.status || order.status || 'processing';
            const statusInfo = getStatusInfo(status);

            return (
              <Card key={order.id} className="order-card">
                {/* Order Header */}
                <Box className="order-header">
                  <Box className="order-info">
                    <Typography className="order-id">
                      Order #{order.id}
                    </Typography>
                    <Typography className="order-date">
                      Placed on {formatDate(order.created_at || order.order_date)}
                    </Typography>
                  </Box>
                  <span className={`order-status-badge ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </Box>

                {/* Delivery Tracking Timeline */}
                <Box className="delivery-tracking">
                  {renderTrackingTimeline(order)}
                </Box>

                {/* Delivery Address */}
                {delivery?.delivery_address && (
                  <Box sx={{ px: 2, py: 2, background: '#f8f9fa' }}>
                    <Box className="delivery-address">
                      <span className="delivery-address-label">
                        📍 Delivery Address
                      </span>
                      <div>{delivery.delivery_address}</div>
                    </Box>
                  </Box>
                )}

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <Box className="order-items">
                    <Typography component="h4">Items in Order</Typography>
                    {order.items.map((item, index) => (
                      <Box key={index} className="item">
                        <Box className="item-details">
                          <Typography className="item-name">
                            {item.product_name || item.name}
                          </Typography>
                          <Typography className="item-quantity">
                            Qty: {item.quantity}
                          </Typography>
                        </Box>
                        <Typography className="item-price">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Order Footer */}
                <Box className="order-footer">
                  <Box className="order-total">
                    <span className="order-total-label">Order Total:</span>
                    <span className="order-total-amount">
                      ${(order.total_price || order.total || 0).toFixed(2)}
                    </span>
                  </Box>
                </Box>
              </Card>
            );
          })}
        </Box>
      </Container>
    </div>
  );
};

export default OrderTrackingPage;
