import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  AttachMoney,
  Discount,
  ReceiptLong,
  Undo,
} from '@mui/icons-material';
import {
  approveReturn,
  getInvoices,
  getPendingReturns,
  getRevenueReport,
  rejectReturn,
  setDiscount,
} from '../services/salesManagerService';

const API_BASE = '/api';

// ─── Discount Tab ─────────────────────────────────────────────────────────────
function DiscountTab({ onSnack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discountValues, setDiscountValues] = useState({});
  const [saving, setSaving] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.products ?? []);
      setProducts(list);
      const init = {};
      list.forEach(p => { init[p.product_id] = p.discount_percent ?? 0; });
      setDiscountValues(init);
    } catch {
      onSnack('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [onSnack]);

  useEffect(() => { load(); }, [load]);

  const handleSet = async (productId) => {
    setSaving(prev => ({ ...prev, [productId]: true }));
    try {
      const pct = parseFloat(discountValues[productId] ?? 0);
      await setDiscount(productId, pct);
      onSnack(`Discount set to ${pct}%`, 'success');
      load();
    } catch (e) {
      onSnack(e.message || 'Failed to set discount', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

  return (
    <TableContainer component={Paper} elevation={2}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#2c3e50' }}>
          <TableRow>
            {['ID', 'Product', 'Price', 'Discount %', 'Discounted Price', 'Action'].map(h => (
              <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map(p => {
            const pct = parseFloat(discountValues[p.product_id] ?? 0);
            const discounted = parseFloat(p.price) * (1 - pct / 100);
            return (
              <TableRow key={p.product_id} hover>
                <TableCell>{p.product_id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{p.product_name}</TableCell>
                <TableCell>${parseFloat(p.price).toFixed(2)}</TableCell>
                <TableCell sx={{ width: 120 }}>
                  <TextField
                    type="number"
                    size="small"
                    inputProps={{ min: 0, max: 100, step: 1 }}
                    value={discountValues[p.product_id] ?? 0}
                    onChange={e => setDiscountValues(prev => ({ ...prev, [p.product_id]: e.target.value }))}
                    sx={{ width: 90 }}
                  />
                </TableCell>
                <TableCell>
                  {pct > 0 ? (
                    <Typography sx={{ color: '#27ae60', fontWeight: 700 }}>
                      ${discounted.toFixed(2)}
                    </Typography>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={!!saving[p.product_id]}
                    onClick={() => handleSet(p.product_id)}
                    sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
                  >
                    {saving[p.product_id] ? 'Saving…' : 'Set'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Revenue Tab ──────────────────────────────────────────────────────────────
function RevenueTab({ onSnack }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('2000-01-01');
  const [to, setTo] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getRevenueReport(from, to);
      setReport(data);
    } catch (e) {
      onSnack(e.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField label="From" type="date" size="small" value={from}
          onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" size="small" value={to}
          onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={load} disabled={loading}
          sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
          {loading ? 'Loading…' : 'Apply'}
        </Button>
      </Box>

      {report && (
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'Revenue', value: `$${report.revenue.toFixed(2)}`, color: '#27ae60' },
            { label: 'Refunds', value: `$${report.refunds.toFixed(2)}`, color: '#e74c3c' },
            { label: 'Net Revenue', value: `$${report.net_revenue.toFixed(2)}`, color: '#3498db' },
            { label: 'Orders', value: report.order_count, color: '#2c3e50' },
            { label: 'Refund Count', value: report.refund_count, color: '#e67e22' },
          ].map(({ label, value, color }) => (
            <Paper key={label} elevation={2} sx={{ p: 3, minWidth: 160, textAlign: 'center', borderTop: `4px solid ${color}` }}>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                {label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color, mt: 0.5 }}>
                {value}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
function InvoicesTab({ onSnack }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState('2000-01-01');
  const [to, setTo] = useState(today);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getInvoices(from, to);
      setOrders(data?.orders ?? []);
    } catch (e) {
      onSnack(e.message || 'Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const STATUS_COLOR = { processing: 'warning', in_transit: 'info', delivered: 'success', cancelled: 'default', returned: 'secondary' };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField label="From" type="date" size="small" value={from}
          onChange={e => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" size="small" value={to}
          onChange={e => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
        <Button variant="contained" onClick={load} disabled={loading}
          sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
          {loading ? 'Loading…' : 'Apply'}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : orders.length === 0 ? (
        <Typography color="textSecondary">No orders in this date range.</Typography>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#2c3e50' }}>
              <TableRow>
                {['Order ID', 'Status', 'Date', 'Address', 'Items', 'Total'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.order_id} hover>
                  <TableCell>#{o.order_id}</TableCell>
                  <TableCell>
                    <Chip
                      label={o.status}
                      color={STATUS_COLOR[o.status?.toLowerCase().replace('-', '_')] || 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(o.created_at).toLocaleDateString()}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {o.delivery_address}
                  </TableCell>
                  <TableCell>
                    {(o.items ?? []).map(item => (
                      <Typography key={item.order_item_id} variant="caption" display="block">
                        {item.product_name} × {item.quantity} @ ${parseFloat(item.unit_price).toFixed(2)}
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>
                    ${parseFloat(o.total_amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ─── Returns Tab ──────────────────────────────────────────────────────────────
function ReturnsTab({ onSnack }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingReturns();
      setRequests(data?.requests ?? []);
    } catch (e) {
      onSnack(e.message || 'Failed to load return requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [onSnack]);

  useEffect(() => { load(); }, [load]);

  const handle = async (requestId, action) => {
    setProcessing(prev => ({ ...prev, [requestId]: true }));
    try {
      if (action === 'approve') await approveReturn(requestId);
      else await rejectReturn(requestId);
      onSnack(`Return request #${requestId} ${action}d`, 'success');
      load();
    } catch (e) {
      onSnack(e.message || `Failed to ${action} return`, 'error');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

  return requests.length === 0 ? (
    <Typography color="textSecondary">No pending return requests.</Typography>
  ) : (
    <TableContainer component={Paper} elevation={2}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#2c3e50' }}>
          <TableRow>
            {['Req ID', 'Order', 'Product', 'Qty', 'Refund', 'Customer', 'Requested', 'Actions'].map(h => (
              <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map(r => (
            <TableRow key={r.request_id} hover>
              <TableCell>#{r.request_id}</TableCell>
              <TableCell>#{r.order_id}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{r.product_name}</TableCell>
              <TableCell>{r.quantity}</TableCell>
              <TableCell sx={{ color: '#27ae60', fontWeight: 700 }}>${parseFloat(r.refund_amount).toFixed(2)}</TableCell>
              <TableCell>User #{r.user_id}</TableCell>
              <TableCell>{new Date(r.requested_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="contained" color="success"
                    disabled={!!processing[r.request_id]}
                    onClick={() => handle(r.request_id, 'approve')}>
                    Approve
                  </Button>
                  <Button size="small" variant="outlined" color="error"
                    disabled={!!processing[r.request_id]}
                    onClick={() => handle(r.request_id, 'reject')}>
                    Reject
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const SalesManagerPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const raw = localStorage.getItem('userData');
    if (!raw) { navigate('/login'); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'sales_manager' && user.role !== 'SalesManager') navigate('/');
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const showSnack = (message, severity = 'success') => setSnack({ open: true, message, severity });

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
          Sales Manager Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage discounts, view revenue, invoices and return requests
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ mb: 3, borderBottom: '1px solid #ecf0f1' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ '& .MuiTab-root': { fontWeight: 'bold' } }}>
          <Tab icon={<Discount />} iconPosition="start" label="Discounts" />
          <Tab icon={<AttachMoney />} iconPosition="start" label="Revenue" />
          <Tab icon={<ReceiptLong />} iconPosition="start" label="Invoices" />
          <Tab icon={<Undo />} iconPosition="start" label="Return Requests" />
        </Tabs>
      </Paper>

      {tab === 0 && <DiscountTab onSnack={showSnack} />}
      {tab === 1 && <RevenueTab onSnack={showSnack} />}
      {tab === 2 && <InvoicesTab onSnack={showSnack} />}
      {tab === 3 && <ReturnsTab onSnack={showSnack} />}

      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SalesManagerPage;
