import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  LocalOffer as DiscountIcon,
  TrendingUp as RevenueIcon,
  BarChart as ChartIcon,
  AssignmentReturn as ReturnIcon,
} from '@mui/icons-material';
import DiscountManagementTab from '../components/DiscountManagementTab';
import RevenueReportsTab from '../components/RevenueReportsTab';
import RevenueChartsTab from '../components/RevenueChartsTab';
import ReturnRequestsTab from '../components/ReturnRequestsTab';
import '../styles/SalesManagerPage.css';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function ReturnRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/returns/pending', { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err) {
      setSnack({ open: true, message: `Failed to load return requests: ${err.message}`, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (requestId, action) => {
    try {
      const res = await fetch(`/api/returns/${requestId}/${action}`, {
        method: 'PUT',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSnack({ open: true, message: `Return request ${action}d successfully`, severity: 'success' });
      loadRequests();
    } catch (err) {
      setSnack({ open: true, message: `Failed to ${action} request: ${err.message}`, severity: 'error' });
    }
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
          Pending Return Requests ({requests.length})
        </Typography>
        <Button variant="outlined" size="small" onClick={loadRequests}>
          Refresh
        </Button>
      </Box>

      {requests.length === 0 ? (
        <Alert severity="info">No pending return requests.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Customer ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }} align="right">Qty</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }} align="right">Refund Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Requested At</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.request_id} hover>
                  <TableCell sx={{ color: '#2c3e50' }}>{r.product_name}</TableCell>
                  <TableCell sx={{ color: '#7f8c8d' }}>#{r.user_id}</TableCell>
                  <TableCell align="right" sx={{ color: '#2c3e50' }}>{r.quantity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#27ae60' }}>
                    ${r.refund_amount.toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ color: '#7f8c8d', fontSize: 13 }}>
                    {new Date(r.requested_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#229954' }, mr: 1 }}
                      onClick={() => handleAction(r.request_id, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleAction(r.request_id, 'reject')}
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
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

function SalesManagerPage({ isLoggedIn }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { returnTo: '/sales-manager' } });
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.role !== 'sales_manager' && userData.role !== 'SalesManager' && userData.role !== 'salesmanager') {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  }, [isLoggedIn, navigate]);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 1 }}>
            Sales Manager Dashboard
          </Typography>
          <Typography sx={{ color: '#7f8c8d' }}>
            Manage discounts, view revenue reports, analyze sales performance, and handle return requests
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              borderBottom: '1px solid #e0e0e0',
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: 15,
                color: '#7f8c8d',
                '&.Mui-selected': {
                  color: '#3498db',
                },
              },
            }}
          >
            <Tab
              icon={<DiscountIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Discount Management"
            />
            <Tab
              icon={<RevenueIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Revenue Reports"
            />
            <Tab
              icon={<ChartIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Analytics & Charts"
            />
            <Tab
              icon={<ReturnIcon sx={{ mr: 1 }} />}
              iconPosition="start"
              label="Return Requests"
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <DiscountManagementTab onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 1 && (
              <RevenueReportsTab onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 2 && (
              <RevenueChartsTab onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 3 && (
              <ReturnRequestsTab refreshTrigger={refreshTrigger} />
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default SalesManagerPage;
