import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle, IconButton, Box, Typography,
  Rating, Chip, Divider, Button, CircularProgress, Avatar, Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart as CartIcon,
  RateReview as ReviewIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useCart } from '../context/CartContext';

const fmt = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const ProductDetailModal = ({ product, open, onClose, onOpenRatings, isLoggedIn }) => {
  const { addItem } = useCart();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    setLoadingReviews(true);
    fetch(`/api/products/${product.id}/ratings`)
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [open, product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            position: 'relative',
            bgcolor: '#f8f9fa',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 3,
          }}
        >
          <Box
            component="img"
            src={product.image}
            alt={product.name}
            sx={{ maxHeight: 200, maxWidth: '80%', objectFit: 'contain' }}
          />
          <IconButton
            onClick={onClose}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.05)' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2, pb: 3 }}>
        {/* Name + category */}
        <Box sx={{ mb: 1 }}>
          <Chip label={product.category} size="small" sx={{ mb: 1, bgcolor: '#e8f4fd', color: '#2980b9', fontWeight: 600 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
            {product.name}
          </Typography>
        </Box>

        {/* Rating summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Rating value={product.rating} readOnly precision={0.1} size="small" />
          <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
            {product.rating > 0 ? product.rating.toFixed(1) : 'No ratings yet'}
            {product.reviews > 0 && ` · ${product.reviews} review${product.reviews !== 1 ? 's' : ''}`}
          </Typography>
        </Box>

        {/* Price + stock */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#27ae60' }}>
            ${product.price.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ color: product.stock > 5 ? '#27ae60' : '#e74c3c' }}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Typography>
        </Box>

        {/* Description */}
        {product.description && (
          <Typography variant="body2" sx={{ color: '#555', mb: 2, lineHeight: 1.7 }}>
            {product.description}
          </Typography>
        )}

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<CartIcon />}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            sx={{
              flex: 1,
              bgcolor: added ? '#27ae60' : '#3498db',
              '&:hover': { bgcolor: added ? '#229954' : '#2980b9' },
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
            }}
          >
            {added ? 'Added!' : 'Add to Cart'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReviewIcon />}
            onClick={() => { onClose(); onOpenRatings(product); }}
            sx={{ color: '#27ae60', borderColor: '#27ae60', '&:hover': { bgcolor: '#f0f8f4' } }}
          >
            Review
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Reviews section */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1.5 }}>
          Customer Reviews
        </Typography>

        {loadingReviews ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              No approved reviews yet.{isLoggedIn ? ' Be the first to review!' : ' Log in to leave a review.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {reviews.map((r) => (
              <Box
                key={r.review_id}
                sx={{
                  p: 2, borderRadius: 2,
                  border: '1px solid #f0f0f0',
                  bgcolor: '#fafafa',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: '#3498db', fontSize: 13 }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#2c3e50' }}>
                      {r.user_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#aaa' }}>
                      {fmt(r.created_at)}
                    </Typography>
                  </Box>
                  <Rating value={r.rating} readOnly size="small" />
                </Box>
                {r.comment && (
                  <Typography variant="body2" sx={{ color: '#555', mt: 0.5, ml: '46px', lineHeight: 1.6 }}>
                    {r.comment}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
