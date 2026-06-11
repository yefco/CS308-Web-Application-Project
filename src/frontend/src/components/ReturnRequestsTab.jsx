import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';

const fmt = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

const statusChip = (status) => {
  const map = {
    pending:  { label: 'Pending',  color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'default' },
  };
  const cfg = map[status] ?? { label: status, color: 'default' };
  return <Chip label={cfg.label} color={cfg.color} size="small" />;
};

export default function ReturnRequestsTab({ refreshTrigger }) {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [snack, setSnack]         = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/returns/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load return requests.');
      const data = await res.json();
      setRequests(data.requests ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshTrigger]);

  const handleAction = async (requestId, action) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: action }));
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/returns/${requestId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Failed to ${action} request.`);
      }
      setSnack(
        action === 'approve'
          ? `Request #${requestId} approved — stock restored and refund credited to customer.`
          : `Request #${requestId} rejected.`
      );
      // Remove from list (it's no longer pending)
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: null }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', mb: 2 }}>
        Pending Return Requests
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {snack && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSnack('')}>
          {snack}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: '#95a5a6' }}>
          <Typography>No pending return requests.</Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f4f6f8' }}>
              {['Req #', 'Order #', 'Customer ID', 'Product', 'Qty', 'Refund', 'Requested', 'Status', 'Actions'].map(
                (h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', color: '#7f8c8d' }}>
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.request_id} hover>
                <TableCell>#{r.request_id}</TableCell>
                <TableCell>#{r.order_id}</TableCell>
                <TableCell>#{r.user_id}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>{r.product_name}</TableCell>
                <TableCell align="center">{r.quantity}</TableCell>
                <TableCell sx={{ color: '#27ae60', fontWeight: 700 }}>
                  ${parseFloat(r.refund_amount).toFixed(2)}
                </TableCell>
                <TableCell>{fmt(r.requested_at)}</TableCell>
                <TableCell>{statusChip(r.status)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      disabled={!!actionLoading[r.request_id]}
                      onClick={() => handleAction(r.request_id, 'approve')}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {actionLoading[r.request_id] === 'approve' ? <CircularProgress size={16} /> : 'Approve'}
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<RejectIcon />}
                      disabled={!!actionLoading[r.request_id]}
                      onClick={() => handleAction(r.request_id, 'reject')}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      {actionLoading[r.request_id] === 'reject' ? <CircularProgress size={16} /> : 'Reject'}
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
