import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';
import {
  DeleteOutline,
  FavoriteBorder,
  ShoppingCart,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';
import { getProductImage } from '../utils/productImages';

const WishlistPage = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const { addItem, getItem } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: '/wishlist' } });
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getWishlist();
        if (!cancelled) {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load wishlist.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((item) => item.product_id !== productId));
      setSnack({ open: true, message: 'Removed from wishlist.', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to remove item.', severity: 'error' });
    }
  };

  const handleAddToCart = async (item) => {
    const existing = getItem(item.product_id);
    if ((existing?.quantity ?? 0) >= item.stock_quantity) {
      setSnack({
        open: true,
        message: `Only ${item.stock_quantity} unit(s) available for ${item.product_name}.`,
        severity: 'warning',
      });
      return;
    }

    await addItem(
      {
        id: item.product_id,
        name: item.product_name,
        image: getProductImage(item.product_name),
        stock: item.stock_quantity,
      },
      1
    );
    setSnack({ open: true, message: `${item.product_name} added to cart.`, severity: 'success' });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error && items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
        <FavoriteBorder sx={{ fontSize: 80, color: '#bdc3c7', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          Wishlist Empty
        </Typography>
        <Typography sx={{ color: '#7f8c8d', mb: 4 }}>
          Save products here so you can revisit them later.
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
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            My Wishlist
          </Typography>
          <Typography sx={{ color: '#7f8c8d', mt: 0.5 }}>
            {items.length} saved product{items.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={3}>
          {items.map((item) => {
            const image = getProductImage(item.product_name);
            const outOfStock = item.stock_quantity <= 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={item.wishlist_item_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {image ? (
                    <CardMedia
                      component="img"
                      image={image}
                      alt={item.product_name}
                      sx={{ height: 200, objectFit: 'contain', p: 2, bgcolor: '#fff' }}
                    />
                  ) : (
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#95a5a6' }}>
                      <Typography variant="caption">No Image</Typography>
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', mb: 1 }}>
                      {item.product_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 2, minHeight: 48 }}>
                      {item.description || 'No description available.'}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, color: '#27ae60', mb: 0.5 }}>
                      ${parseFloat(item.price ?? 0).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: outOfStock ? '#e74c3c' : '#27ae60' }}>
                      {outOfStock ? 'Out of stock' : `${item.stock_quantity} in stock`}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<ShoppingCart />}
                      onClick={() => handleAddToCart(item)}
                      disabled={outOfStock}
                      sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
                    >
                      Add to Cart
                    </Button>
                    <IconButton
                      aria-label="remove from wishlist"
                      onClick={() => handleRemove(item.product_id)}
                      sx={{ color: '#e74c3c', border: '1px solid #f0d6d6', borderRadius: 2 }}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
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

export default WishlistPage;
