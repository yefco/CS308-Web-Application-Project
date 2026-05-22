import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getRevenueData } from '../services/salesManagerService';

function RevenueReportsTab({ refreshTrigger }) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    orderCount: 0,
    avgOrderValue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadRevenueData();
  }, [refreshTrigger]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      const data = await getRevenueData(startDate, endDate);
      
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      
      // Calculate metrics
      const totalRevenue = data.orders?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0;
      const orderCount = data.orders?.length || 0;
      
      setMetrics({
        totalRevenue,
        totalProfit: totalRevenue * 0.25, // Mock: assume 25% profit margin
        orderCount,
        avgOrderValue: orderCount > 0 ? totalRevenue / orderCount : 0,
      });
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to load revenue data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      setSnack({ open: true, message: 'No data to export', severity: 'warning' });
      return;
    }

    const headers = ['Order ID', 'Customer', 'Date', 'Amount', 'Status'];
    const rows = orders.map((order) => [
      order.order_id,
      order.user_id,
      new Date(order.created_at).toLocaleDateString(),
      `$${parseFloat(order.total_amount).toFixed(2)}`,
      order.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setSnack({ open: true, message: 'CSV exported successfully', severity: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
        <Button variant="contained" onClick={loadRevenueData} sx={{ bgcolor: '#3498db' }}>
          Generate Report
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          sx={{ color: '#27ae60', borderColor: '#27ae60' }}
        >
          Export CSV
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ color: '#3498db', borderColor: '#3498db' }}
        >
          Print
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: 12, fontWeight: 600 }}>
                Total Revenue
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#27ae60' }}>
                ${metrics.totalRevenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: 12, fontWeight: 600 }}>
                Total Profit
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#3498db' }}>
                ${metrics.totalProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: 12, fontWeight: 600 }}>
                Orders Count
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#e74c3c' }}>
                {metrics.orderCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom sx={{ fontSize: 12, fontWeight: 600 }}>
                Avg Order Value
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#f39c12' }}>
                ${metrics.avgOrderValue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Orders Table */}
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#2c3e50', mb: 2 }}>
        Orders ({orders.length})
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Alert severity="info">No orders found for the selected date range</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Customer ID</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Delivery Address</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }} align="right">
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.order_id} hover>
                  <TableCell sx={{ fontWeight: 600, color: '#3498db' }}>
                    #{order.order_id}
                  </TableCell>
                  <TableCell sx={{ color: '#7f8c8d' }}>{order.user_id}</TableCell>
                  <TableCell sx={{ color: '#7f8c8d', fontSize: 14 }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: '#7f8c8d', fontSize: 13 }}>
                    {order.delivery_address?.substring(0, 30)}...
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: '#27ae60' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize', color: '#7f8c8d' }}>
                    {order.status?.replace('_', ' ')}
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

export default RevenueReportsTab;
