import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  Divider,
} from '@mui/material';
import { Refresh, LocalShipping } from '@mui/icons-material';

const API_BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const STATUS_OPTIONS = [
  { value: 'Processing', label: 'Processing' },
  { value: 'InTransit',  label: 'In Transit' },
  { value: 'Delivered',  label: 'Delivered'  },
];

const STATUS_COLOR = {
  processing: 'warning',
  in_transit: 'info',
  delivered:  'success',
};

function normalizeStatus(s) {
  if (!s) return 'processing';
  return s.toLowerCase().replace('-', '_');
}

function chipColor(status) {
  return STATUS_COLOR[normalizeStatus(status)] || 'default';
}

function chipLabel(status) {
  const s = normalizeStatus(status);
  if (s === 'in_transit') return 'In Transit';
  if (s === 'delivered')  return 'Delivered';
  return 'Processing';
}

const DeliveryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [updatingId, setUpdatingId] = useState(null);

  // Guard: only sales_manager
  useEffect(() => {
    const raw = localStorage.getItem('userData');
    if (!raw) { navigate('/login'); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'sales_manager' && user.role !== 'SalesManager') {
        navigate('/');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/delivery/orders`, { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : (data?.orders ?? []));
    } catch (e) {
      setError(e.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/delivery/orders/${orderId}/status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setOrders(prev => prev.map(o =>
        o.order_id === orderId ? { ...o, status: updated.status } : o
      ));
      setSnack({ open: true, message: `Order #${orderId} status updated to ${chipLabel(newStatus)}`, severity: 'success' });
    } catch (e) {
      setSnack({ open: true, message: e.message || 'Update failed', severity: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <LocalShipping sx={{ color: '#3498db', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            Delivery Dashboard
          </Typography>
        </Box>
        <Typography variant="body1" color="textSecondary">
          View all orders and update their delivery status.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
              All Orders ({orders.length})
            </Typography>
            <Button startIcon={<Refresh />} onClick={fetchOrders} variant="outlined" size="small" disabled={loading}>
              Refresh
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : orders.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 4, color: '#7f8c8d' }}>
              No orders yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: '#2c3e50' }}>
                <TableRow>
                  {['Order ID', 'Date', 'Delivery Address', 'Items', 'Total', 'Status', 'Update Status'].map(h => (
                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(order => {
                  const orderId = order.order_id ?? order.id;
                  const status = order.status ?? 'processing';
                  const isUpdating = updatingId === orderId;

                  return (
                    <TableRow key={orderId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>#{orderId}</TableCell>
                      <TableCell>{fmt(order.created_at)}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.delivery_address || '—'}
                      </TableCell>
                      <TableCell>
                        {order.items && order.items.length > 0 ? (
                          <Box>
                            {order.items.map((item, i) => (
                              <Typography key={i} variant="caption" display="block" sx={{ color: '#555' }}>
                                {item.product_name} × {item.quantity}
                              </Typography>
                            ))}
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#27ae60' }}>
                        ${parseFloat(order.total_amount ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={chipLabel(status)}
                          color={chipColor(status)}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }} disabled={isUpdating}>
                          <Select
                            value={(() => {
                              const s = normalizeStatus(status);
                              if (s === 'in_transit') return 'InTransit';
                              if (s === 'delivered')  return 'Delivered';
                              return 'Processing';
                            })()}
                            onChange={(e) => handleStatusChange(orderId, e.target.value)}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {isUpdating && <CircularProgress size={16} sx={{ ml: 1 }} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DeliveryPage;
