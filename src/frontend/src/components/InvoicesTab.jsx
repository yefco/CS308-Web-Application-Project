import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Alert,
  Snackbar,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Download as DownloadIcon,
  Print as PrintIcon,
} from '@mui/icons-material';

const STATUS_COLORS = {
  processing: '#f39c12',
  in_transit: '#3498db',
  delivered: '#27ae60',
  cancelled: '#e74c3c',
  returned: '#8e44ad',
};

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const status = order.status?.replace('_', ' ');
  const color = STATUS_COLORS[order.status] ?? '#7f8c8d';

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 40, py: 1 }}>
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600, color: '#3498db' }}>#{order.order_id}</TableCell>
        <TableCell sx={{ color: '#7f8c8d' }}>Customer #{order.user_id}</TableCell>
        <TableCell sx={{ color: '#7f8c8d', fontSize: 13 }}>
          {new Date(order.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell sx={{ color: '#7f8c8d', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.delivery_address}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 700, color: '#27ae60' }}>
          ${parseFloat(order.total_amount).toFixed(2)}
        </TableCell>
        <TableCell>
          <Chip
            label={status}
            size="small"
            sx={{ bgcolor: color, color: '#fff', fontWeight: 600, textTransform: 'capitalize', fontSize: 11 }}
          />
        </TableCell>
        <TableCell sx={{ color: '#7f8c8d', fontSize: 12 }}>
          {(order.items ?? []).length} item{(order.items ?? []).length !== 1 ? 's' : ''}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ m: 1, mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#2c3e50', mb: 1, display: 'block' }}>
                Line Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f4f6f8' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Product</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(order.items ?? []).map((item) => (
                    <TableRow key={item.order_item_id}>
                      <TableCell sx={{ fontSize: 13 }}>{item.product_name}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13 }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13 }}>${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600 }}>${parseFloat(item.subtotal).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function InvoicesTab() {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  })();

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/invoices?from=${from}&to=${to}`, { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err) {
      setSnack({ open: true, message: `Failed to load invoices: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { loadInvoices(); }, []);

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const handleExportCSV = () => {
    if (orders.length === 0) {
      setSnack({ open: true, message: 'No data to export', severity: 'warning' });
      return;
    }
    const rows = [
      ['Order ID', 'Customer ID', 'Date', 'Status', 'Total', 'Product', 'Qty', 'Unit Price', 'Subtotal'],
    ];
    orders.forEach((o) => {
      (o.items ?? []).forEach((item) => {
        rows.push([
          `#${o.order_id}`,
          o.user_id,
          new Date(o.created_at).toLocaleDateString(),
          o.status,
          `$${parseFloat(o.total_amount).toFixed(2)}`,
          item.product_name,
          item.quantity,
          `$${parseFloat(item.unit_price).toFixed(2)}`,
          `$${parseFloat(item.subtotal).toFixed(2)}`,
        ]);
      });
    });
    const csv = rows.map((r) => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (orders.length === 0) {
      setSnack({ open: true, message: 'No invoices to print', severity: 'warning' });
      return;
    }

    const statusColor = { processing: '#f39c12', in_transit: '#3498db', delivered: '#27ae60', cancelled: '#e74c3c', returned: '#8e44ad' };

    const orderBlocks = orders.map((o) => {
      const itemRows = (o.items ?? []).map((item) => `
        <tr>
          <td>${item.product_name}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">$${parseFloat(item.unit_price).toFixed(2)}</td>
          <td style="text-align:right;font-weight:600">$${parseFloat(item.subtotal).toFixed(2)}</td>
        </tr>`).join('');

      const color = statusColor[o.status] ?? '#7f8c8d';
      return `
        <div class="order-block">
          <div class="order-header">
            <span class="order-id">Order #${o.order_id}</span>
            <span>Customer #${o.user_id}</span>
            <span>${new Date(o.created_at).toLocaleDateString()}</span>
            <span style="color:${color};font-weight:600;text-transform:capitalize">${o.status.replace('_',' ')}</span>
            <span class="order-total">$${parseFloat(o.total_amount).toFixed(2)}</span>
          </div>
          <div style="font-size:12px;color:#7f8c8d;margin-bottom:6px">${o.delivery_address}</div>
          <table>
            <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Subtotal</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoices ${from} to ${to}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #2c3e50; padding: 32px; background: white; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #7f8c8d; font-size: 13px; margin-bottom: 6px; }
    .summary { display: flex; gap: 32px; margin-bottom: 20px; padding: 12px 16px; background: #f8f9fa; border-radius: 6px; }
    .summary div { font-size: 13px; color: #7f8c8d; }
    .summary strong { display: block; font-size: 17px; color: #2c3e50; margin-top: 2px; }
    .order-block { margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 6px; overflow: hidden; page-break-inside: avoid; }
    .order-header { display: flex; justify-content: space-between; align-items: center; background: #f4f6f8; padding: 8px 12px; flex-wrap: wrap; gap: 8px; font-size: 13px; }
    .order-id { font-weight: 700; color: #3498db; }
    .order-total { font-weight: 700; color: #27ae60; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f4f6f8; padding: 6px 10px; text-align: left; font-weight: 600; border-bottom: 1px solid #e0e0e0; }
    td { padding: 5px 10px; border-bottom: 1px solid #f0f0f0; }
    tr:last-child td { border-bottom: none; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Invoice Report</h1>
  <div class="subtitle">Period: ${from} — ${to} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString()}</div>
  <div class="summary">
    <div>Total Invoiced<strong>$${orders.reduce((s,o)=>s+parseFloat(o.total_amount||0),0).toFixed(2)}</strong></div>
    <div>Orders<strong>${orders.length}</strong></div>
  </div>
  ${orderBlocks}
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=900');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };


  return (
    <>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <TextField
          label="To"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <Button variant="contained" onClick={loadInvoices} sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
          Load Invoices
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          sx={{ color: '#27ae60', borderColor: '#27ae60' }}
        >
          Export CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          title="Opens print preview — choose 'Save as PDF' in the print dialog"
          sx={{ color: '#8e44ad', borderColor: '#8e44ad' }}
        >
          Print / Save as PDF
        </Button>
      </Box>

      {/* Summary */}
      {orders.length > 0 && (
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ bgcolor: '#eafaf1', borderRadius: 2, px: 3, py: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#27ae60', fontWeight: 700 }}>Total Invoiced</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#27ae60' }}>${totalRevenue.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ bgcolor: '#ebf5fb', borderRadius: 2, px: 3, py: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#3498db', fontWeight: 700 }}>Orders</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#3498db' }}>{orders.length}</Typography>
          </Box>
        </Box>
      )}

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Alert severity="info">No invoices found for the selected date range.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#2c3e50' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', width: 40 }} />
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Order ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Delivery Address</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }} align="right">Total</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Items</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <OrderRow key={order.order_id} order={order} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}

export default InvoicesTab;
