import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh,
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
  const [dialogAction, setDialogAction] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);

  const loadPendingComments = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      const response = await getPendingComments();
      setComments(response.comments || []);
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
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Comment Approval
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={`${pendingCount} pending`}
            color={pendingCount > 0 ? 'warning' : 'success'}
            size="small"
          />

          <Button
            startIcon={<Refresh />}
            onClick={loadPendingComments}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#2c3e50' }}>
              <TableRow>
                {['ID', 'Product', 'Customer', 'Comment', 'Rating', 'Date', 'Status', 'Actions'].map(
                  (h) => (
                    <TableCell key={h} sx={{ color: '#fff', fontWeight: 'bold' }}>
                      {h}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#7f8c8d' }}>
                    No pending comments found
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => {
                  const isActionLoading = actionLoadingId === comment.comment_id;

                  return (
                    <TableRow key={comment.comment_id} hover>
                      <TableCell>{comment.comment_id}</TableCell>

                      <TableCell sx={{ fontWeight: 500 }}>
                        {comment.product_name || '—'}
                      </TableCell>

                      <TableCell>
                        {comment.customer_name || '—'}
                      </TableCell>

                      <TableCell
                        sx={{
                          maxWidth: 360,
                          whiteSpace: 'normal',
                          color: '#2c3e50',
                        }}
                      >
                        {comment.comment_text || '—'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={`${comment.rating}/5`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell>
                        {comment.created_at
                          ? new Date(comment.created_at).toLocaleString()
                          : '—'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label="Pending"
                          color="warning"
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Tooltip title="Approve">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => openActionDialog(comment, 'approve')}
                              disabled={isActionLoading}
                              sx={{ color: '#27ae60' }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Reject">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => openActionDialog(comment, 'reject')}
                              disabled={isActionLoading}
                              sx={{ color: '#e74c3c' }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={closeActionDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2c3e50', color: '#fff' }}>
          {dialogAction === 'approve' ? 'Approve Comment' : 'Reject Comment'}
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <Typography>
            Are you sure you want to{' '}
            <strong>{dialogAction === 'approve' ? 'approve' : 'reject'}</strong>
            {selectedComment
              ? ` the comment for "${selectedComment.product_name}"`
              : ' this comment'}
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeActionDialog}>
            Cancel
          </Button>

          <Button
            onClick={handleConfirmAction}
            variant="contained"
            color={dialogAction === 'approve' ? 'success' : 'error'}
            disabled={actionLoadingId !== null}
          >
            {actionLoadingId !== null ? 'Processing…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CommentApprovalPage;