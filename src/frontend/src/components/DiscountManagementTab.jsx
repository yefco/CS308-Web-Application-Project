import React, { useState, useEffect } from 'react';
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
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import {
  getDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getProducts,
} from '../services/salesManagerService';

function DiscountManagementTab({ refreshTrigger }) {
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    product_id: '',
    discount_percentage: '',
    start_date: '',
    end_date: '',
  });

  // Load discounts and products
  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [discountsData, productsData] = await Promise.all([
        getDiscounts(),
        getProducts(),
      ]);
      setDiscounts(Array.isArray(discountsData) ? discountsData : discountsData?.discounts || []);
      setProducts(Array.isArray(productsData) ? productsData : productsData?.products || []);
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setForm({
        product_id: discount.product_id,
        discount_percentage: discount.discount_percentage,
        start_date: discount.start_date?.split('T')[0] || '',
        end_date: discount.end_date?.split('T')[0] || '',
      });
    } else {
      setEditingDiscount(null);
      setForm({ product_id: '', discount_percentage: '', start_date: '', end_date: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDiscount(null);
    setForm({ product_id: '', discount_percentage: '', start_date: '', end_date: '' });
  };

  const handleSave = async () => {
    if (!form.product_id || !form.discount_percentage || !form.start_date || !form.end_date) {
      setSnack({ open: true, message: 'Please fill all fields', severity: 'error' });
      return;
    }

    try {
      if (editingDiscount) {
        await updateDiscount(editingDiscount.discount_id, form);
        setSnack({ open: true, message: 'Discount updated successfully', severity: 'success' });
      } else {
        await createDiscount(form);
        setSnack({ open: true, message: 'Discount created successfully', severity: 'success' });
      }
      handleCloseDialog();
      loadData();
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to save', severity: 'error' });
    }
  };

  const handleDelete = async (discountId) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await deleteDiscount(discountId);
        setSnack({ open: true, message: 'Discount deleted successfully', severity: 'success' });
        loadData();
      } catch (err) {
        setSnack({ open: true, message: err.message || 'Failed to delete', severity: 'error' });
      }
    }
  };

  const getProductName = (productId) => {
    const product = products.find((p) => p.product_id === productId);
    return product?.product_name || `Product #${productId}`;
  };

  const isDiscountActive = (discount) => {
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50' }}>
          Active Discounts ({discounts.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' } }}
        >
          New Discount
        </Button>
      </Box>

      {discounts.length === 0 ? (
        <Alert severity="info">No discounts yet. Create one to get started!</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }} align="right">
                  Discount %
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discounts.map((discount) => (
                <TableRow key={discount.discount_id} hover>
                  <TableCell sx={{ color: '#2c3e50' }}>
                    {getProductName(discount.product_id)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#e74c3c' }}>
                    -{discount.discount_percentage}%
                  </TableCell>
                  <TableCell sx={{ color: '#7f8c8d', fontSize: 14 }}>
                    {new Date(discount.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: '#7f8c8d', fontSize: 14 }}>
                    {new Date(discount.end_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isDiscountActive(discount) ? 'Active' : 'Inactive'}
                      color={isDiscountActive(discount) ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(discount)}
                      sx={{ color: '#3498db' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(discount.discount_id)}
                      sx={{ color: '#e74c3c' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, bgcolor: '#f8f9fa' }}>
          {editingDiscount ? 'Edit Discount' : 'Create New Discount'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            select
            label="Product"
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: parseInt(e.target.value) })}
            fullWidth
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name}
              </option>
            ))}
          </TextField>
          <TextField
            label="Discount Percentage"
            type="number"
            value={form.discount_percentage}
            onChange={(e) => setForm({ ...form, discount_percentage: parseInt(e.target.value) })}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
          />
          <TextField
            label="Start Date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#27ae60' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

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

export default DiscountManagementTab;
