import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Typography,
  InputAdornment,
} from '@mui/material';
import {
  LocalOffer as DiscountIcon,
  AttachMoney as PriceIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const API_BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function DiscountManagementTab({ refreshTrigger }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Shared dialog state — type is 'discount' | 'price'
  const [dialog, setDialog] = useState({ open: false, type: null, product: null });
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products ?? []);
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to load products', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, refreshTrigger]);

  const openDialog = (type, product) => {
    setDialog({ open: true, type, product });
    setInputValue(
      type === 'discount'
        ? String(parseFloat(product.discount_percent ?? 0))
        : String(parseFloat(product.price ?? 0))
    );
  };

  const closeDialog = () => {
    setDialog({ open: false, type: null, product: null });
    setInputValue('');
  };

  const handleSave = async () => {
    const { type, product } = dialog;
    const value = parseFloat(inputValue);

    if (isNaN(value) || value < 0) {
      setSnack({ open: true, message: 'Please enter a valid non-negative number', severity: 'error' });
      return;
    }
    if (type === 'discount' && value > 100) {
      setSnack({ open: true, message: 'Discount cannot exceed 100%', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      const endpoint = type === 'discount'
        ? `${API_BASE}/products/${product.product_id}/discount`
        : `${API_BASE}/products/${product.product_id}/price`;

      const body = type === 'discount'
        ? { discount_percent: value }
        : { price: value };

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || res.statusText);
      }

      const updated = await res.json();

      // Patch the product row in state so the new price appears immediately
      setProducts((prev) =>
        prev.map((p) => (p.product_id === product.product_id ? updated : p))
      );

      const label = type === 'discount'
        ? `Discount set to ${value}% for "${product.product_name}"`
        : `Price updated to $${value.toFixed(2)} for "${product.product_name}"`;

      setSnack({ open: true, message: label, severity: 'success' });
      closeDialog();
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Save failed', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
          Products — {products.length} total
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadProducts}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {products.length === 0 ? (
        <Alert severity="info">No products found.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#2c3e50' }}>
              <TableRow>
                {['ID', 'Name', 'Base Price', 'Discount', 'Sale Price', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 700 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {products.map((p) => {
                const basePrice = parseFloat(p.price ?? 0);
                const discountPct = parseFloat(p.discount_percent ?? 0);
                const salePrice = p.discounted_price != null
                  ? parseFloat(p.discounted_price)
                  : basePrice * (1 - discountPct / 100);

                return (
                  <TableRow key={p.product_id} hover>
                    <TableCell sx={{ color: '#7f8c8d' }}>{p.product_id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{p.product_name}</TableCell>

                    <TableCell sx={{ fontWeight: 600 }}>${basePrice.toFixed(2)}</TableCell>

                    <TableCell>
                      {discountPct > 0 ? (
                        <Chip
                          label={`-${discountPct}%`}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      ) : (
                        <Chip label="None" size="small" variant="outlined" />
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: discountPct > 0 ? '#e74c3c' : '#27ae60',
                        }}
                      >
                        ${salePrice.toFixed(2)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PriceIcon />}
                          onClick={() => openDialog('price', p)}
                          sx={{ color: '#3498db', borderColor: '#3498db', whiteSpace: 'nowrap' }}
                        >
                          Set Price
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DiscountIcon />}
                          onClick={() => openDialog('discount', p)}
                          sx={{ color: '#e74c3c', borderColor: '#e74c3c', whiteSpace: 'nowrap' }}
                        >
                          Set Discount
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Shared dialog */}
      <Dialog open={dialog.open} onClose={saving ? undefined : closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: dialog.type === 'price' ? '#3498db' : '#e74c3c', color: '#fff' }}>
          {dialog.type === 'price' ? 'Set Price' : 'Set Discount'}
          {dialog.product ? ` — ${dialog.product.product_name}` : ''}
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {dialog.type === 'price' ? (
            <TextField
              fullWidth
              label="New Price"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              inputProps={{ min: 0, step: '0.01' }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              autoFocus
            />
          ) : (
            <>
              <TextField
                fullWidth
                label="Discount Percent (0 to remove)"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                inputProps={{ min: 0, max: 100, step: '1' }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                autoFocus
              />
              {dialog.product && parseFloat(inputValue) > 0 && !isNaN(parseFloat(inputValue)) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Sale price will be{' '}
                  <strong>
                    ${(parseFloat(dialog.product.price) * (1 - parseFloat(inputValue) / 100)).toFixed(2)}
                  </strong>
                  {'. '}
                  Wishlist owners will be notified automatically.
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              bgcolor: dialog.type === 'price' ? '#3498db' : '#e74c3c',
              '&:hover': { bgcolor: dialog.type === 'price' ? '#2980b9' : '#c0392b' },
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default DiscountManagementTab;
