import React, { useState, useEffect, useCallback } from 'react';
import CommentApprovalPage from './CommentApprovalPage';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Inventory,
  Category,
  Refresh,
} from '@mui/icons-material';

const API_BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

const emptyProduct = {
  category_id: '',
  product_name: '',
  model: '',
  serial_number: '',
  description: '',
  stock_quantity: 0,
  price: '',
  warranty_status: false,
  distributor_info: '',
};

const emptyCategory = {
  category_name: '',
  description: '',
};

// ─── Products Tab ─────────────────────────────────────────────────────────────
function ProductsTab({ categories, onSnack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [stockValue, setStockValue] = useState('');
  const [targetProduct, setTargetProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products ?? []);
    } catch {
      onSnack('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [onSnack]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      category_id: product.category_id ?? '',
      product_name: product.product_name ?? '',
      model: product.model ?? '',
      serial_number: product.serial_number ?? '',
      description: product.description ?? '',
      stock_quantity: product.stock_quantity ?? 0,
      price: product.price ?? '',
      warranty_status: product.warranty_status ?? false,
      distributor_info: product.distributor_info ?? '',
    });
    setDialogOpen(true);
  };

  const openStock = (product) => {
    setTargetProduct(product);
    setStockValue(String(product.stock_quantity ?? 0));
    setStockDialogOpen(true);
  };

  const openDelete = (product) => {
    setTargetProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const body = {
      ...form,
      category_id: Number(form.category_id),
      stock_quantity: Number(form.stock_quantity),
      price: parseFloat(form.price),
    };
    try {
      const url = editingProduct
        ? `${API_BASE}/products/${editingProduct.product_id}`
        : `${API_BASE}/products`;
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
      }
      onSnack(editingProduct ? 'Product updated' : 'Product created', 'success');
      setDialogOpen(false);
      fetchProducts();
    } catch (e) {
      onSnack(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/products/${targetProduct.product_id}/stock`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ stock_quantity: Number(stockValue) }),
        },
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message);
      onSnack('Stock updated', 'success');
      setStockDialogOpen(false);
      fetchProducts();
    } catch (e) {
      onSnack(e.message || 'Stock update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/products/${targetProduct.product_id}`,
        { method: 'DELETE', headers: authHeaders() },
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message);
      onSnack('Product deleted', 'success');
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (e) {
      onSnack(e.message || 'Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const categoryName = (id) =>
    categories.find((c) => c.category_id === id)?.category_name ?? id ?? '—';

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Products
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<Refresh />} onClick={fetchProducts} variant="outlined" size="small">
            Refresh
          </Button>
          <Button startIcon={<Add />} onClick={openCreate} variant="contained"
            sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
            Add Product
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#2c3e50' }}>
              <TableRow>
                {['ID', 'Name', 'Model', 'Category', 'Price', 'Stock', 'Warranty', 'Actions'].map(
                  (h) => (
                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {h}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#7f8c8d' }}>
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.product_id} hover>
                    <TableCell>{p.product_id}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{p.product_name}</TableCell>
                    <TableCell>{p.model}</TableCell>
                    <TableCell>{categoryName(p.category_id)}</TableCell>
                    <TableCell>${parseFloat(p.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.stock_quantity}
                        color={p.stock_quantity > 5 ? 'success' : p.stock_quantity > 0 ? 'warning' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.warranty_status ? 'Yes' : 'No'}
                        color={p.warranty_status ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#3498db' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Update Stock">
                        <IconButton size="small" onClick={() => openStock(p)} sx={{ color: '#27ae60' }}>
                          <Inventory fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => openDelete(p)} sx={{ color: '#e74c3c' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2c3e50', color: '#fff' }}>
          {editingProduct ? 'Edit Product' : 'New Product'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              select
              label="Category"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              fullWidth
              required
            >
              {categories.map((c) => (
                <MenuItem key={c.category_id} value={c.category_id}>
                  {c.category_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Product Name" value={form.product_name} required
              onChange={(e) => setForm({ ...form, product_name: e.target.value })} fullWidth />
            <TextField label="Model" value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })} fullWidth />
            <TextField label="Serial Number" value={form.serial_number} required
              onChange={(e) => setForm({ ...form, serial_number: e.target.value })} fullWidth />
            <TextField label="Description" value={form.description} multiline rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Price ($)" type="number" value={form.price} required
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                inputProps={{ min: 0, step: '0.01' }} fullWidth />
              <TextField label="Stock Qty" type="number" value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                inputProps={{ min: 0 }} fullWidth />
            </Box>
            <TextField label="Distributor Info" value={form.distributor_info}
              onChange={(e) => setForm({ ...form, distributor_info: e.target.value })} fullWidth />
            <FormControlLabel
              control={
                <Switch
                  checked={form.warranty_status}
                  onChange={(e) => setForm({ ...form, warranty_status: e.target.checked })}
                  color="success"
                />
              }
              label="Warranty Included"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stock Dialog */}
      <Dialog open={stockDialogOpen} onClose={() => setStockDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2c3e50', color: '#fff' }}>Update Stock</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {targetProduct?.product_name}
          </Typography>
          <TextField
            fullWidth
            label="New Stock Quantity"
            type="number"
            value={stockValue}
            onChange={(e) => setStockValue(e.target.value)}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStockDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleStockUpdate} variant="contained" disabled={saving}
            sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#219a52' } }}>
            {saving ? 'Updating…' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete <strong>{targetProduct?.product_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={saving}>
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab({ categories, onCategoriesChange, onSnack }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyCategory);
  const [targetCategory, setTargetCategory] = useState(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingCategory(null);
    setForm(emptyCategory);
    setDialogOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({ category_name: cat.category_name ?? '', description: cat.description ?? '' });
    setDialogOpen(true);
  };

  const openDelete = (cat) => {
    setTargetCategory(cat);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingCategory
        ? `${API_BASE}/categories/${editingCategory.category_id}`
        : `${API_BASE}/categories`;
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || res.statusText);
      }
      onSnack(editingCategory ? 'Category updated' : 'Category created', 'success');
      setDialogOpen(false);
      onCategoriesChange();
    } catch (e) {
      onSnack(e.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/categories/${targetCategory.category_id}`,
        { method: 'DELETE', headers: authHeaders() },
      );
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message);
      onSnack('Category deleted', 'success');
      setDeleteDialogOpen(false);
      onCategoriesChange();
    } catch (e) {
      onSnack(e.message || 'Delete failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Categories
        </Typography>
        <Button startIcon={<Add />} onClick={openCreate} variant="contained"
          sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
          Add Category
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#2c3e50' }}>
            <TableRow>
              {['ID', 'Name', 'Description', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#7f8c8d' }}>
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.category_id} hover>
                  <TableCell>{c.category_id}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{c.category_name}</TableCell>
                  <TableCell sx={{ color: '#7f8c8d' }}>{c.description || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#3498db' }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => openDelete(c)} sx={{ color: '#e74c3c' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2c3e50', color: '#fff' }}>
          {editingCategory ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Category Name" value={form.category_name} required
              onChange={(e) => setForm({ ...form, category_name: e.target.value })} fullWidth />
            <TextField label="Description" value={form.description} multiline rows={3}
              onChange={(e) => setForm({ ...form, description: e.target.value })} fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Delete category <strong>{targetCategory?.category_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={saving}>
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ProductManagerPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [categories, setCategories] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  // Guard: only product_manager role can access this page
  useEffect(() => {
    const raw = localStorage.getItem('userData');
    if (!raw) { navigate('/login'); return; }
    try {
      const user = JSON.parse(raw);
      if (user.role !== 'product_manager' && user.role !== 'ProductManager') {
        navigate('/');
      }
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories ?? []);
    } catch {
      showSnack('Failed to load categories', 'error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
          Product Manager Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage your store's products and categories
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderBottom: '1px solid #ecf0f1' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ '& .MuiTab-root': { fontWeight: 'bold' } }}
        >
          <Tab icon={<Inventory />} iconPosition="start" label="Products" />
          <Tab icon={<Category />} iconPosition="start" label="Categories" />
          <Tab icon={<CommentIcon />} iconPosition="start" label="Comment Approval" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      {tab === 0 && (
        <ProductsTab categories={categories} onSnack={showSnack} />
      )}
      {tab === 1 && (
        <CategoriesTab
          categories={categories}
          onCategoriesChange={fetchCategories}
          onSnack={showSnack}
        />
      )}
      {tab === 2 && <CommentApprovalPage />}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductManagerPage;
