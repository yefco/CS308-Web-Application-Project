import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import {
  getPendingComments,
  approveComment,
  rejectComment,
} from '../services/commentApprovalService';

const CommentApprovalPage = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState(null); // 'approve' | 'reject'
  const [selectedComment, setSelectedComment] = useState(null);

  const loadPendingComments = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await getPendingComments();
      const pendingComments = response.comments || [];
      setComments(pendingComments);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load pending comments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingComments();
  }, []);

  const openActionDialog = (comment, action) => {
    setSelectedComment(comment);
    setDialogAction(action);
    setDialogOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const closeActionDialog = () => {
    setDialogOpen(false);
    setSelectedComment(null);
    setDialogAction(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedComment || !dialogAction) return;

    try {
      setActionLoadingId(selectedComment.comment_id);
      setErrorMessage('');
      setSuccessMessage('');

      if (dialogAction === 'approve') {
        await approveComment(selectedComment.comment_id);
        setSuccessMessage('Comment approved successfully.');
      } else {
        await rejectComment(selectedComment.comment_id);
        setSuccessMessage('Comment rejected successfully.');
      }

      setComments((prev) =>
        prev.filter((comment) => comment.comment_id !== selectedComment.comment_id)
      );

      closeActionDialog();
    } catch (error) {
      setErrorMessage(error.message || 'Operation failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingCount = comments.length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h2" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
          Comment Approval
        </Typography>
        <Typography variant="body1" sx={{ color: '#7f8c8d' }}>
          Review pending customer comments and decide whether they should become visible.
        </Typography>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                Pending Comments
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : comments.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                  <CommentIcon sx={{ fontSize: 48, color: '#bdc3c7', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: '#2c3e50', mb: 1 }}>
                    No pending comments
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                    There are currently no comments waiting for approval.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {comments.map((comment) => {
                    const isActionLoading = actionLoadingId === comment.comment_id;

                    return (
                      <Grid item xs={12} key={comment.comment_id}>
                        <Card
                          sx={{
                            border: '1px solid #e0e0e0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            borderRadius: 2,
                          }}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: 2,
                                mb: 2,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 'bold', color: '#2c3e50' }}
                                >
                                  {comment.product_name}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                                  Customer: {comment.customer_name}
                                </Typography>
                              </Box>

                              <Chip
                                label="Pending"
                                sx={{
                                  bgcolor: '#f39c12',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                            </Box>

                            <Typography
                              variant="body1"
                              sx={{
                                color: '#2c3e50',
                                mb: 2,
                                lineHeight: 1.7,
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {comment.comment_text}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                gap: 3,
                                flexWrap: 'wrap',
                                mb: 2,
                              }}
                            >
                              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                                <strong>Rating:</strong> {comment.rating}/5
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                                <strong>Comment ID:</strong> {comment.comment_id}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                                <strong>Date:</strong>{' '}
                                {new Date(comment.created_at).toLocaleString()}
                              </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Button
                                variant="contained"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => openActionDialog(comment, 'approve')}
                                disabled={isActionLoading}
                                sx={{
                                  bgcolor: '#27ae60',
                                  '&:hover': { bgcolor: '#229954' },
                                  fontWeight: 'bold',
                                  minWidth: 140,
                                }}
                              >
                                {isActionLoading ? 'Processing...' : 'Approve'}
                              </Button>

                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => openActionDialog(comment, 'reject')}
                                disabled={isActionLoading}
                                sx={{ fontWeight: 'bold', minWidth: 140 }}
                              >
                                Reject
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              position: 'sticky',
              top: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3, color: '#2c3e50' }}>
                Summary
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Pending Comments:</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{pendingCount}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Role:</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>Product Manager</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography sx={{ color: '#7f8c8d' }}>Status:</Typography>
                  <Typography sx={{ fontWeight: 'bold', color: '#f39c12' }}>
                    Review Required
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" sx={{ color: '#7f8c8d', lineHeight: 1.8 }}>
                Only approved comments should become visible on the product pages.
                Rejected comments must remain hidden.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={dialogOpen} onClose={closeActionDialog}>
        <DialogTitle sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
          {dialogAction === 'approve' ? 'Approve Comment' : 'Reject Comment'}
        </DialogTitle>

        <DialogContent>
          <Typography sx={{ color: '#2c3e50' }}>
            Are you sure you want to{' '}
            <strong>{dialogAction === 'approve' ? 'approve' : 'reject'}</strong>
            {selectedComment ? ` the comment for "${selectedComment.product_name}"` : ' this comment'}?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeActionDialog} sx={{ color: '#7f8c8d' }}>
            Cancel
          </Button>

          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={dialogAction === 'approve' ? 'success' : 'error'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CommentApprovalPage;