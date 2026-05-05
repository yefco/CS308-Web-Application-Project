import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { submitProductRating, getUserProductRating } from '../services/ratingsService';

const RatingsModal = ({ open, productId, productName, onClose, onSuccess, isLoggedIn }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingRating, setExistingRating] = useState(null);

  // Load user's existing rating when modal opens
  useEffect(() => {
    if (open && isLoggedIn && productId) {
      loadUserRating();
    } else if (open && !isLoggedIn) {
      setRating(0);
      setComment('');
      setExistingRating(null);
    }
  }, [open, productId, isLoggedIn]);

  const loadUserRating = async () => {
    try {
      const data = await getUserProductRating(productId);
      if (data) {
        setExistingRating(data);
        setRating(data.rating || 0);
        setComment(data.comment || '');
      }
    } catch (err) {
      // It's okay if user hasn't rated this product yet
      setRating(0);
      setComment('');
      setExistingRating(null);
    }
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setError('Please log in to submit a rating.');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await submitProductRating(productId, rating, comment);

      setRating(0);
      setComment('');
      setExistingRating(null);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('404') || msg.toLowerCase().includes('not found') || msg === 'Something went wrong.') {
        setError('Rating & review feature is not yet available. Please check back later.');
      } else {
        setError(msg || 'Failed to submit rating. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setRating(0);
    setComment('');
    setExistingRating(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Rate {productName}
        {existingRating && (
          <Typography variant="caption" display="block" color="textSecondary">
            You've already rated this product
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {!isLoggedIn ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please log in to submit a rating or comment.
          </Alert>
        ) : null}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
            Your Rating
          </Typography>
          <Rating
            name="rating"
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
              setError('');
            }}
            size="large"
            disabled={!isLoggedIn || loading}
          />
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            Rate from 1 to 5 stars
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment (Optional)"
            placeholder="Share your thoughts about this product..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={!isLoggedIn || loading}
            variant="outlined"
            helperText={`${comment.length}/500 characters`}
            inputProps={{ maxLength: 500 }}
          />
        </Box>

        {existingRating && (
          <Alert severity="info">
            Submitting a new rating will update your previous rating.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isLoggedIn || loading || rating === 0}
          sx={{ bgcolor: '#3498db', '&:hover': { bgcolor: '#2980b9' } }}
        >
          {loading ? <CircularProgress size={24} /> : 'Submit Rating'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingsModal;
